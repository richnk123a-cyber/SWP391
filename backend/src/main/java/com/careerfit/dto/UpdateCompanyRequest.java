package com.careerfit.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateCompanyRequest {

    @Size(min = 2, max = 150, message = "Tên công ty phải từ 2 đến 150 ký tự.")
    private String companyName;

    @Size(min = 2, max = 100, message = "Tên người đại diện phải từ 2 đến 100 ký tự.")
    private String recruiterName;

    private String phone;
    private String website;
    private String industry;
    private String size;
    private String location;
    private String logo;
}
