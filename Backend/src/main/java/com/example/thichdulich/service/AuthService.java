package com.example.thichdulich.service;

import com.example.thichdulich.dto.AuthRequest;
import com.example.thichdulich.dto.AuthResponse;
import com.example.thichdulich.dto.RegisterPendingResponse;
import com.example.thichdulich.dto.RegisterRequest;
import com.example.thichdulich.dto.UserDTO;
import com.example.thichdulich.dto.VerifyEmailRequest;
import com.example.thichdulich.entity.EmailVerificationCode;
import com.example.thichdulich.entity.Provider;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.mapper.DtoMapper;
import com.example.thichdulich.repository.EmailVerificationCodeRepository;
import com.example.thichdulich.repository.ProviderRepository;
import com.example.thichdulich.repository.UserRepository;
import com.example.thichdulich.security.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
@Transactional
public class AuthService {
    private static final long OTP_EXPIRES_SECONDS = 300;
    private static final long RESEND_COOLDOWN_SECONDS = 60;
    private static final SecureRandom OTP_RANDOM = new SecureRandom();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProviderRepository providerRepository;

    @Autowired
    private EmailVerificationCodeRepository verificationCodeRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtProvider jwtProvider;

    public AuthResponse login(AuthRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không chính xác"));

        if (!Boolean.TRUE.equals(user.getEnabled())) {
            throw new AccessDeniedException("Vui lòng xác minh email trước khi đăng nhập");
        }
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không chính xác");
        }
        if (!user.isAccountUsable()) {
            throw new AccessDeniedException("Tài khoản của bạn đã bị khóa");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtProvider.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, "Bearer", user.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }

    public RegisterPendingResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        User existing = userRepository.findByEmail(email).orElse(null);
        if (existing != null) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }
        if (false) {
            throw new IllegalArgumentException("Email này đã được đăng ký bằng Google");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setIsActive(true);
        user.setIsBanned(false);
        user.setEnabled(false);
        user.setProvider(User.AuthProvider.LOCAL);

        String roleString = request.getRole() != null ? request.getRole().toLowerCase(Locale.ROOT) : "user";
        try {
            user.setRole(User.UserRole.valueOf(roleString));
        } catch (IllegalArgumentException e) {
            user.setRole(User.UserRole.user);
        }

        User savedUser = userRepository.save(user);
        ensureProviderProfileIfNeeded(savedUser, request);
        sendNewOtp(savedUser);
        return new RegisterPendingResponse(savedUser.getEmail(), true, OTP_EXPIRES_SECONDS, RESEND_COOLDOWN_SECONDS);
    }

    public void verifyEmail(VerifyEmailRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại"));
        if (Boolean.TRUE.equals(user.getEnabled())) {
            return;
        }

        EmailVerificationCode verificationCode = verificationCodeRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(
                        email,
                        EmailVerificationCode.Purpose.EMAIL_VERIFICATION)
                .orElseThrow(() -> new IllegalArgumentException("Mã OTP không hợp lệ hoặc đã được sử dụng"));

        if (verificationCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            verificationCode.setUsed(true);
            verificationCodeRepository.save(verificationCode);
            throw new IllegalArgumentException("Mã OTP đã hết hạn");
        }
        if (!passwordEncoder.matches(request.getCode(), verificationCode.getCodeHash())) {
            throw new IllegalArgumentException("Mã OTP không chính xác");
        }

        verificationCode.setUsed(true);
        verificationCodeRepository.save(verificationCode);
        user.setEnabled(true);
        userRepository.save(user);
    }

    public RegisterPendingResponse resendOtp(String email) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại"));
        if (Boolean.TRUE.equals(user.getEnabled())) {
            throw new IllegalArgumentException("Email đã được xác minh");
        }

        EmailVerificationCode latest = verificationCodeRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(
                        normalizedEmail,
                        EmailVerificationCode.Purpose.EMAIL_VERIFICATION)
                .orElse(null);
        if (latest != null && latest.getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
            long remaining = Duration.between(LocalDateTime.now(), latest.getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS)).toSeconds();
            throw new IllegalArgumentException("Vui lòng đợi " + Math.max(1, remaining) + " giây trước khi gửi lại mã");
        }

        sendNewOtp(user);
        return new RegisterPendingResponse(user.getEmail(), true, OTP_EXPIRES_SECONDS, RESEND_COOLDOWN_SECONDS);
    }

    public RegisterPendingResponse forgotPassword(String email) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại"));
        if (user.getProvider() == User.AuthProvider.GOOGLE) {
            throw new IllegalArgumentException("Tài khoản này đăng nhập bằng Google, không thể đặt lại mật khẩu");
        }

        EmailVerificationCode latest = verificationCodeRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(
                        normalizedEmail,
                        EmailVerificationCode.Purpose.PASSWORD_RESET)
                .orElse(null);
        if (latest != null && latest.getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
            long remaining = Duration.between(LocalDateTime.now(), latest.getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS)).toSeconds();
            throw new IllegalArgumentException("Vui lòng đợi " + Math.max(1, remaining) + " giây trước khi gửi lại mã");
        }

        sendOtp(user, EmailVerificationCode.Purpose.PASSWORD_RESET);
        return new RegisterPendingResponse(user.getEmail(), true, OTP_EXPIRES_SECONDS, RESEND_COOLDOWN_SECONDS);
    }

    public void resetPassword(String email, String code, String newPassword) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại"));
        if (user.getProvider() == User.AuthProvider.GOOGLE) {
            throw new IllegalArgumentException("Tài khoản này đăng nhập bằng Google, không thể đặt lại mật khẩu");
        }

        EmailVerificationCode verificationCode = verificationCodeRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(
                        normalizedEmail,
                        EmailVerificationCode.Purpose.PASSWORD_RESET)
                .orElseThrow(() -> new IllegalArgumentException("Mã OTP không hợp lệ hoặc đã được sử dụng"));

        if (verificationCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            verificationCode.setUsed(true);
            verificationCodeRepository.save(verificationCode);
            throw new IllegalArgumentException("Mã OTP đã hết hạn");
        }
        if (!passwordEncoder.matches(code, verificationCode.getCodeHash())) {
            throw new IllegalArgumentException("Mã OTP không chính xác");
        }

        verificationCode.setUsed(true);
        verificationCodeRepository.save(verificationCode);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setEnabled(true);
        userRepository.save(user);
    }

    public AuthResponse loginOrCreateGoogleUser(String email, String name, String avatarUrl) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(normalizedEmail);
            newUser.setName((name == null || name.isBlank()) ? normalizedEmail : name);
            newUser.setPasswordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            newUser.setRole(User.UserRole.user);
            newUser.setProvider(User.AuthProvider.GOOGLE);
            newUser.setEnabled(true);
            newUser.setIsActive(true);
            newUser.setIsBanned(false);
            return newUser;
        });

        if (user.getName() == null || user.getName().isBlank()) {
            user.setName((name == null || name.isBlank()) ? normalizedEmail : name);
        }
        if (user.getAvatar() == null || user.getAvatar().isBlank()) {
            user.setAvatar(avatarUrl);
        }
        user.setEnabled(true);
        user.setLastLogin(LocalDateTime.now());
        User saved = userRepository.save(user);

        String token = jwtProvider.generateToken(saved.getId(), saved.getEmail());
        return new AuthResponse(token, "Bearer", saved.getId(), saved.getName(), saved.getEmail(), saved.getRole().name());
    }

    public UserDTO getMe(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return DtoMapper.toUserDTO(user);
    }

    private void sendNewOtp(User user) {
        sendOtp(user, EmailVerificationCode.Purpose.EMAIL_VERIFICATION);
    }

    private void sendOtp(User user, EmailVerificationCode.Purpose purpose) {
        verificationCodeRepository.findByEmailAndPurposeAndUsedFalse(user.getEmail(), purpose).forEach(code -> {
            code.setUsed(true);
            verificationCodeRepository.save(code);
        });

        String otp = String.format("%06d", OTP_RANDOM.nextInt(1_000_000));
        EmailVerificationCode code = new EmailVerificationCode();
        code.setEmail(user.getEmail());
        code.setCodeHash(passwordEncoder.encode(otp));
        code.setPurpose(purpose);
        code.setExpiresAt(LocalDateTime.now().plusSeconds(OTP_EXPIRES_SECONDS));
        verificationCodeRepository.save(code);
        if (purpose == EmailVerificationCode.Purpose.PASSWORD_RESET) {
            emailService.sendPasswordResetOtp(user.getEmail(), otp, user.getName());
        } else {
            emailService.sendVerificationOtp(user.getEmail(), otp, user.getName());
        }
    }

    private void ensureProviderProfileIfNeeded(User savedUser, RegisterRequest request) {
        if (savedUser.getRole() != User.UserRole.provider || savedUser.getProviderProfile() != null) {
            return;
        }
        Provider provider = new Provider();
        provider.setUser(savedUser);
        provider.setCompanyName(request.getName());
        provider.setPhone(request.getPhone());
        provider.setTaxCode(request.getTaxCode());
        provider.setStatus(Provider.ProviderStatus.pending);
        provider.setJoinedDate(LocalDate.now());
        providerRepository.save(provider);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
