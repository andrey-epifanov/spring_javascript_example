package com.example.hierarchy.controller;

import com.example.hierarchy.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class PageController {

    private final GoalService goalService;

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/risks")
    public String risks() {
        return "risks";
    }

    @GetMapping("/tanks")
    public String tanks() {
        return "tanks";
    }

    @GetMapping("/goals")
    public String goals(Model model) {
        model.addAttribute("goals", goalService.getGoals());
        return "goals";
    }

    @GetMapping("/goals/edit")
    public String goalsEdit(Model model) {
        model.addAttribute("goals", goalService.getGoals());
        return "goals-edit";
    }
}
