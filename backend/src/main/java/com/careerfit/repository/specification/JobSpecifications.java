package com.careerfit.repository.specification;

import com.careerfit.model.Job;
import com.careerfit.model.Skill;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class JobSpecifications {

    private JobSpecifications() {
    }

    public static Specification<Job> publicSearch(
            String keyword,
            String location,
            String category,
            String jobType,
            Long minSalary,
            Long maxSalary,
            String salaryCurrency) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("verificationStatus"), "Verified"));
            predicates.add(builder.isTrue(root.get("isVisible")));

            if (keyword != null) {
                String pattern = containsPattern(keyword);
                Join<Job, Skill> skill = root.join("skills", JoinType.LEFT);
                query.distinct(true);
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("title")), pattern),
                        builder.like(builder.lower(root.get("description")), pattern),
                        builder.like(builder.lower(skill.get("name")), pattern)
                ));
            }

            if (location != null) {
                predicates.add(builder.like(builder.lower(root.get("location")), containsPattern(location)));
            }
            if (category != null) {
                predicates.add(builder.equal(builder.lower(root.get("category")), category.toLowerCase(Locale.ROOT)));
            }
            if (jobType != null) {
                predicates.add(builder.like(builder.lower(root.get("jobType")), containsPattern(jobType)));
            }
            if (minSalary != null || maxSalary != null) {
                String targetCurrency = (salaryCurrency != null && !salaryCurrency.isBlank())
                        ? salaryCurrency.trim().toUpperCase(Locale.ROOT)
                        : "VNĐ";
                predicates.add(builder.equal(builder.upper(root.get("salaryCurrency")), targetCurrency));
                predicates.add(builder.isNotNull(root.get("salaryMin")));
                predicates.add(builder.isNotNull(root.get("salaryMax")));
            }
            if (minSalary != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("salaryMax"), minSalary));
            }
            if (maxSalary != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("salaryMin"), maxSalary));
            }

            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static String containsPattern(String value) {
        return "%" + value.toLowerCase(Locale.ROOT) + "%";
    }
}
