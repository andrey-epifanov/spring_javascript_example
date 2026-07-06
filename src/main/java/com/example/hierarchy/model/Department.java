package com.example.hierarchy.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Department {

    MANAGEMENT("Руководство"),
    IT("IT"),
    SALES("Продажи"),
    HR("HR");

    private final String displayName;

    Department(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }
}
