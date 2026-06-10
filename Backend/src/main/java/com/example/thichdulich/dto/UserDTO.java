package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private String id;

    @Size(min = 2, max = 100, message = "Họ tên phải từ 2 đến 100 ký tự")
    private String name;

    @Email(message = "Email không đúng định dạng")
    private String email;

    @Pattern(regexp = "^(0[0-9]{9}|\\+84[0-9]{9})$", message = "Số điện thoại phải đúng định dạng Việt Nam, ví dụ 0912345678 hoặc +84912345678")
    private String phone;

    private String avatar;

    private String role;

    private Boolean active;

    private Boolean banned;

    private LocalDateTime createdAt;

    private Long totalBookings;

    private Double totalSpent;
}
