package com.careerfit.model;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "companies")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Company {
    @Id @Column(length = 50) private String id;
    @Column(name = "owner_user_id", length = 50) private String ownerUserId;
    @Column(name = "company_name", length = 150) private String companyName;
    @Column(name = "recruiter_name", length = 100) private String recruiterName;
    @Column(length = 100) private String email;
    @Column(length = 150) private String website;
    @Column(length = 100) private String industry;
    @Column(length = 50) private String size;
    @Column(length = 100) private String location;
    @Column(name = "logo", columnDefinition = "NVARCHAR(MAX)") private String logo;
    @Column(name = "verification_status", length = 20) private String verificationStatus;
    @Column(name = "business_license_file", length = 255) private String businessLicenseFile;
    @Column(name = "rejection_reason", columnDefinition = "NVARCHAR(MAX)") private String rejectionReason;
    @Column(length = 20) private String phone;
}