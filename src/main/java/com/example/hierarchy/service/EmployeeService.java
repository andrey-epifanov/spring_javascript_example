package com.example.hierarchy.service;

import com.example.hierarchy.model.EmployeeNode;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService {

    public List<EmployeeNode> getOrganizationTree() {
        return List.of(
                EmployeeNode.builder()
                        .id(1L)
                        .name("Иванов Иван")
                        .position("Генеральный директор")
                        .department("Руководство")
                        .subordinates(List.of(
                                EmployeeNode.builder()
                                        .id(2L)
                                        .name("Петрова Анна")
                                        .position("Директор IT")
                                        .department("IT")
                                        .subordinates(List.of(
                                                EmployeeNode.builder()
                                                        .id(5L)
                                                        .name("Сидоров Алексей")
                                                        .position("Ведущий разработчик")
                                                        .department("IT")
                                                        .subordinates(List.of(
                                                                EmployeeNode.builder()
                                                                        .id(8L)
                                                                        .name("Козлов Дмитрий")
                                                                        .position("Разработчик")
                                                                        .department("IT")
                                                                        .build()
                                                        ))
                                                        .build(),
                                                EmployeeNode.builder()
                                                        .id(6L)
                                                        .name("Морозова Елена")
                                                        .position("QA-инженер")
                                                        .department("IT")
                                                        .build()
                                        ))
                                        .build(),
                                EmployeeNode.builder()
                                        .id(3L)
                                        .name("Смирнов Пётр")
                                        .position("Директор продаж")
                                        .department("Продажи")
                                        .subordinates(List.of(
                                                EmployeeNode.builder()
                                                        .id(7L)
                                                        .name("Волкова Ольга")
                                                        .position("Менеджер по продажам")
                                                        .department("Продажи")
                                                        .build()
                                        ))
                                        .build(),
                                EmployeeNode.builder()
                                        .id(4L)
                                        .name("Новикова Мария")
                                        .position("Директор HR")
                                        .department("HR")
                                        .build()
                        ))
                        .build()
        );
    }
}
