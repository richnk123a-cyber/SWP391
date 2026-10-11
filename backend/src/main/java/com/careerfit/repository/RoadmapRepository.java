package com.careerfit.repository;

import com.careerfit.model.Roadmap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoadmapRepository extends JpaRepository<Roadmap, String> {
    Optional<Roadmap> findBySkillId(String skillId);
    Optional<Roadmap> findBySkillNameIgnoreCase(String skillName);
}
