package com.careerfit.repository;

import com.careerfit.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, String> {
    Optional<Skill> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    List<Skill> findByIsActiveTrue();
    List<Skill> findByCategory(String category);
}
