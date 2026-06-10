package com.example.thichdulich.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProviderProfileDTO {
    private String id;
    private String userId;

    @NotBlank(message = "Vui lòng nhập tên công ty")
    @Size(max = 200, message = "Tên công ty tối đa 200 ký tự")
    private String companyName;

    @NotBlank(message = "Vui lòng nhập email công ty")
    @Email(message = "Email công ty không đúng định dạng")
    @Size(max = 150, message = "Email tối đa 150 ký tự")
    private String email;

    @NotBlank(message = "Vui lòng nhập số điện thoại công ty")
    @Pattern(regexp = "^[0-9+() .-]{8,15}$", message = "Số điện thoại công ty không đúng định dạng")
    private String phone;

    private String address;

    private String description;

    @NotBlank(message = "Vui lòng nhập mã số thuế")
    @Pattern(regexp = "^[0-9-]{10,14}$", message = "Mã số thuế không đúng định dạng")
    private String taxCode;

    @NotBlank(message = "Vui lòng nhập số giấy phép kinh doanh")
    @Size(max = 100, message = "Số giấy phép kinh doanh tối đa 100 ký tự")
    private String licenseNumber;

    private String status;
    private Boolean verified;
    private String joinedDate;
}
