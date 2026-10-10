package com.careerfit.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterCandidateRequest {

    @NotBlank(message = "Họ và tên không được để trống.")
    @Size(min = 2, max = 100, message = "Họ và tên phải từ 2 đến 100 ký tự.")
    @Pattern(
        regexp = "^[\\p{L}\\s.'-]+$",
        message = "Họ và tên không hợp lệ."
    )
    private String fullName;

    // Tên đăng nhập là tùy chọn - nếu không nhập, hệ thống tự động sinh từ email
    private String username;

    @NotBlank(message = "Email không được để trống.")
    @Email(message = "Email không đúng định dạng.")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống.")
    @Size(min = 8, max = 100, message = "Mật khẩu phải có từ 8 đến 100 ký tự.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\\s])[\\s\\S]*$",
        message = "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt."
    )
    private String password;

    @NotBlank(message = "Vui lòng xác nhận mật khẩu.")
    private String confirmPassword;

    @NotBlank(message = "Số điện thoại không được để trống.")
    @Pattern(
        regexp = "^(03|05|07|08|09)\\d{8}$",
        message = "Số điện thoại không hợp lệ. Phải có 10 số, bắt đầu bằng 03/05/07/08/09."
    )
    private String phone;

    @NotBlank(message = "Vui lòng nhập vị trí mục tiêu.")
    @Size(min = 2, max = 100, message = "Vị trí mục tiêu phải từ 2 đến 100 ký tự.")
    private String targetRole;

    @NotBlank(message = "Vui lòng chọn tỉnh/thành phố.")
    private String location;

    @NotBlank(message = "Vui lòng chọn trình độ hiện tại.")
    @Pattern(
        regexp = "^(INTERN|FRESHER|JUNIOR|MIDDLE|SENIOR)$",
        message = "Trình độ không hợp lệ."
    )
    private String level;
}
