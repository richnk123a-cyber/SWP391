package com.careerfit.repository;

import com.careerfit.model.RoadmapTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoadmapTopicRepository extends JpaRepository<RoadmapTopic, String> {
    List<RoadmapTopic> findByRoadmapIdOrderByStepOrderAsc(String roadmapId);
}
