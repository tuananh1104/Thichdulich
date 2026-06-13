package com.example.thichdulich.service;

import com.example.thichdulich.dto.UploadResponseDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class CloudinaryUploadService {
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${cloudinary.url:}")
    private String cloudinaryUrl;

    @Value("${cloudinary.folder:thichdulich}")
    private String rootFolder;

    @Value("${app.upload.max-image-size-bytes:5242880}")
    private long maxImageSizeBytes;

    public List<UploadResponseDTO> uploadImages(MultipartFile[] files, String folder) {
        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất 1 ảnh");
        }
        List<UploadResponseDTO> responses = new ArrayList<>();
        for (MultipartFile file : files) {
            responses.add(uploadImage(file, folder));
        }
        return responses;
    }

    public UploadResponseDTO uploadImage(MultipartFile file, String folder) {
        CloudinaryCredentials credentials = resolveCredentials();
        validateFile(file);

        try {
            long timestamp = Instant.now().getEpochSecond();
            String uploadFolder = normalizeFolder(folder);
            String signature = sha1("folder=" + uploadFolder + "&timestamp=" + timestamp + credentials.apiSecret());
            String boundary = "----ThichDulichCloudinary" + UUID.randomUUID();

            byte[] body = multipartBody(boundary, file, List.of(
                    field("api_key", credentials.apiKey()),
                    field("timestamp", String.valueOf(timestamp)),
                    field("folder", uploadFolder),
                    field("signature", signature)
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.cloudinary.com/v1_1/" + credentials.cloudName() + "/image/upload"))
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalArgumentException("Cloudinary upload failed: " + readCloudinaryError(response.body()));
            }

            JsonNode json = objectMapper.readTree(response.body());
            return new UploadResponseDTO(
                    json.path("secure_url").asText(),
                    json.path("public_id").asText(),
                    json.path("format").asText(),
                    json.path("width").isNumber() ? json.path("width").asInt() : null,
                    json.path("height").isNumber() ? json.path("height").asInt() : null,
                    json.path("bytes").isNumber() ? json.path("bytes").asLong() : null
            );
        } catch (IOException e) {
            throw new IllegalArgumentException("Không thể đọc file ảnh");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalArgumentException("Upload ảnh bị gián đoạn");
        }
    }

    private void validateConfig() {
        if (cloudName == null || cloudName.isBlank() || apiKey == null || apiKey.isBlank() || apiSecret == null || apiSecret.isBlank()) {
            throw new IllegalStateException("Thiếu cấu hình Cloudinary. Vui lòng đặt CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET");
        }
    }

    private CloudinaryCredentials resolveCredentials() {
        if (!isBlank(cloudName) && !isBlank(apiKey) && !isBlank(apiSecret)) {
            return new CloudinaryCredentials(cloudName.trim(), apiKey.trim(), apiSecret.trim());
        }

        if (!isBlank(cloudinaryUrl)) {
            try {
                URI uri = URI.create(cloudinaryUrl.trim());
                String userInfo = uri.getUserInfo();
                String host = uri.getHost();
                if ("cloudinary".equalsIgnoreCase(uri.getScheme()) && !isBlank(userInfo) && !isBlank(host)) {
                    String[] parts = userInfo.split(":", 2);
                    if (parts.length == 2 && !isBlank(parts[0]) && !isBlank(parts[1])) {
                        return new CloudinaryCredentials(decode(host), decode(parts[0]), decode(parts[1]));
                    }
                }
            } catch (IllegalArgumentException ex) {
                throw new IllegalStateException("Cloudinary configuration is invalid. Please check CLOUDINARY_URL.");
            }
        }

        throw new IllegalStateException("Cloudinary configuration is missing. Please set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File ảnh không hợp lệ");
        }
        if (file.getSize() > maxImageSizeBytes) {
            throw new IllegalArgumentException("Ảnh không được vượt quá " + (maxImageSizeBytes / 1024 / 1024) + "MB");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF");
        }
    }

    private String normalizeFolder(String folder) {
        String child = folder == null ? "general" : folder.trim().toLowerCase(Locale.ROOT);
        child = child.replaceAll("[^a-z0-9/_-]", "-").replaceAll("-+", "-");
        if (child.isBlank()) child = "general";
        String root = rootFolder == null || rootFolder.isBlank() ? "thichdulich" : rootFolder.trim();
        return root.replaceAll("/+$", "") + "/" + child.replaceAll("^/+", "");
    }

    private String readCloudinaryError(String body) {
        if (body == null || body.isBlank()) {
            return "Unknown Cloudinary error";
        }
        try {
            String message = objectMapper.readTree(body).path("error").path("message").asText();
            return message == null || message.isBlank() ? body : message;
        } catch (Exception ex) {
            return body;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private byte[] multipartBody(String boundary, MultipartFile file, List<FormField> fields) throws IOException {
        List<byte[]> parts = new ArrayList<>();
        for (FormField field : fields) {
            parts.add(("--" + boundary + "\r\n"
                    + "Content-Disposition: form-data; name=\"" + field.name() + "\"\r\n\r\n"
                    + field.value() + "\r\n").getBytes(StandardCharsets.UTF_8));
        }
        String filename = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()
                ? "image"
                : file.getOriginalFilename().replaceAll("[\\r\\n\"]", "");
        parts.add(("--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\n"
                + "Content-Type: " + file.getContentType() + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        parts.add(file.getBytes());
        parts.add("\r\n".getBytes(StandardCharsets.UTF_8));
        parts.add(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

        int size = parts.stream().mapToInt(part -> part.length).sum();
        byte[] body = new byte[size];
        int offset = 0;
        for (byte[] part : parts) {
            System.arraycopy(part, 0, body, offset, part.length);
            offset += part.length;
        }
        return body;
    }

    private FormField field(String name, String value) {
        return new FormField(name, value);
    }

    private String sha1(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Không thể ký request Cloudinary");
        }
    }

    private record FormField(String name, String value) {
    }

    private record CloudinaryCredentials(String cloudName, String apiKey, String apiSecret) {
    }
}
