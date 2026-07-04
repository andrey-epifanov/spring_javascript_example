package com.example.hierarchy.controller;

import com.example.hierarchy.model.EmployeeNode;
import com.example.hierarchy.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeRestController {

    private final EmployeeService employeeService;

    @GetMapping("/tree")
    public List<EmployeeNode> getTree() {
        return employeeService.getOrganizationTree();
    }
}
