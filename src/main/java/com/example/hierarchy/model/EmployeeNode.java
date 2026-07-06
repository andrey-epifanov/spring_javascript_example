package com.example.hierarchy.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeNode {

    private Long id;
    private String name;
    private String position;
    private Department department;

    @Builder.Default
    private List<EmployeeNode> subordinates = new ArrayList<>();
}
