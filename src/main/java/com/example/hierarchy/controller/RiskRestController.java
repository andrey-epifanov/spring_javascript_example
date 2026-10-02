package com.example.hierarchy.controller;

import com.example.hierarchy.model.ProjectRisk;
import com.example.hierarchy.model.RiskReorderItem;
import com.example.hierarchy.model.RiskUpdateDto;
import com.example.hierarchy.service.RiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
    public List<ProjectRisk> reorder(@RequestBody List<RiskReorderItem> items) {
        return riskService.reorder(items);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectRisk> update(@PathVariable Long id, @RequestBody RiskUpdateDto dto) {
        ProjectRisk updated = riskService.updateRisk(id, dto);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }
}
