package com.example.thichdulich.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {
    @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại")
    private String currentPassword;

    @NotBlank(message = "Vui lòng nhập mật khẩu mới")
    @Size(min = 6, max = 72, message = "Mật khẩu mới phải từ 6 đến 72 ký tự")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,72}$", message = "Mật khẩu mới phải có ít nhất 6 ký tự, 1 chữ in hoa và 1 ký tự đặc biệt")
    private String newPassword;
}
