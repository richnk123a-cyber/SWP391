package com.careerfit.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CompanyResponse {
    private String id;
    private String ownerUserId;
    private String companyName;
    private String recruiterName;
    private String email;
    private String website;
    private String industry;
    private String size;
    private String location;
    private String logo;
    private String verificationStatus;
    private String rejectionReason;
}
