package com.example.hierarchy.controller;

import com.example.hierarchy.model.ProjectRisk;
import com.example.hierarchy.service.RiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/risks")
@RequiredArgsConstructor
public class RiskRestController {

    private final RiskService riskService;

    @GetMapping
    public List<ProjectRisk> getRisks() {
        return riskService.getRisks();
    }

    @PutMapping("/reorder")
    public List<ProjectRisk> reorder(@RequestBody List<Long> orderedIds) {
        return riskService.reorder(orderedIds);
    }
}
