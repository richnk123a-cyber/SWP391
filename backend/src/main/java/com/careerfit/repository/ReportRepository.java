package com.careerfit.repository;

import com.careerfit.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, String> {
    List<Report> findByJobId(String jobId);
    List<Report> findByReporterId(String reporterId);
}
