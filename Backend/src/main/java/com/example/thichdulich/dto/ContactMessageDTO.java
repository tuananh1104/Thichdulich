package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactMessageDTO {
    private String id;

    @NotBlank(message = "Vui lòng nhập họ tên")
    @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
    private String name;

    @Email(message = "Email không đúng định dạng")
    @NotBlank(message = "Vui lòng nhập email")
    private String email;

    @Pattern(regexp = "^$|^(0[0-9]{9}|\\+84[0-9]{9})$", message = "Số điện thoại phải đúng định dạng Việt Nam, ví dụ 0912345678 hoặc +84912345678")
    private String phone;

    @NotBlank(message = "Vui lòng nhập tiêu đề")
    @Size(max = 200, message = "Tiêu đề không được vượt quá 200 ký tự")
    private String subject;

    @NotBlank(message = "Vui lòng nhập nội dung")
    @Size(max = 3000, message = "Nội dung không được vượt quá 3000 ký tự")
    private String message;

    private String status; // new, replied, resolved

    private String repliedBy;

    private LocalDateTime repliedAt;

    private String replyMessage;

    private LocalDateTime createdAt;
}
