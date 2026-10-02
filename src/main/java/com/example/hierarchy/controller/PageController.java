package com.example.hierarchy.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

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
}
