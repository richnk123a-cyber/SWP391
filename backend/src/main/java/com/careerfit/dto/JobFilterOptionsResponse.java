package com.careerfit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobFilterOptionsResponse {
    private List<String> categories;
    private List<String> jobTypes;
    private List<String> locations;
}
