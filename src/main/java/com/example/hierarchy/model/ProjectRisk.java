package com.example.hierarchy.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRisk {

    private Long id;
    private String position;
    private String title;
    private String description;
    private String category;
}
