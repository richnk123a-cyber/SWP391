package com.careerfit.repository;

import com.careerfit.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, String> {
    Optional<Company> findByOwnerUserId(String ownerUserId);
    boolean existsByPhone(String phone);
}
