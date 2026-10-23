package com.example.hierarchy.controller;

import com.example.hierarchy.model.GoalStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.util.Arrays;
import java.util.List;

/**
 * Отдаёт справочник статусов целей во все представления через @ModelAttribute.
 */
@ControllerAdvice
public class EnumHelpController {

    @ModelAttribute("goalStatuses")
    public List<String> goalStatuses() {
        return Arrays.stream(GoalStatus.values())
                .map(GoalStatus::getLabel)
                .toList();
    }
}