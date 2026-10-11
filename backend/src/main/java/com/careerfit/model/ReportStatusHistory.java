package com.careerfit.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "report_status_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportStatusHistory {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "report_id", length = 50, nullable = false)
    private String reportId;

    @Column(name = "from_status", length = 20)
    private String fromStatus;

    @Column(name = "to_status", length = 20, nullable = false)
    private String toStatus;

    @Column(name = "changed_by", length = 50, nullable = false)
    private String changedBy;

    @Column(name = "admin_note", columnDefinition = "NVARCHAR(MAX)")
    private String adminNote;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
