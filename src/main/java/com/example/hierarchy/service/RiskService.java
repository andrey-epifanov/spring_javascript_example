package com.example.hierarchy.service;

import com.example.hierarchy.model.ProjectRisk;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class RiskService {

    private final List<ProjectRisk> risks = new ArrayList<>(List.of(
            ProjectRisk.builder()
                    .id(1L).position(1)
                    .title("Превышение бюджета")
                    .description("Фактические затраты могут превысить утверждённый бюджет проекта")
                    .category("Финансовый")
                    .build(),
            ProjectRisk.builder()
                    .id(2L).position(2)
                    .title("Срыв сроков")
                    .description("Задержки на этапах разработки или согласований")
                    .category("Сроки")
                    .build(),
            ProjectRisk.builder()
                    .id(3L).position(3)
                    .title("Нехватка ресурсов")
                    .description("Недостаток квалифицированных специалистов в команде")
                    .category("Ресурсы")
                    .build(),
            ProjectRisk.builder()
                    .id(4L).position(4)
                    .title("Изменение требований")
                    .description("Заказчик может менять требования в процессе работ")
                    .category("Объём работ")
                    .build(),
            ProjectRisk.builder()
                    .id(5L).position(5)
                    .title("Проблемы интеграции")
                    .description("Сложности при интеграции с внешними системами")
                    .category("Технический")
                    .build(),
            ProjectRisk.builder()
                    .id(6L).position(6)
                    .title("Зависимость от подрядчиков")
                    .description("Задержки или некачественная работа внешних подрядчиков")
                    .category("Внешний")
                    .build(),
            ProjectRisk.builder()
                    .id(7L).position(7)
                    .title("Низкое качество тестирования")
                    .description("Недостаточное покрытие тестами и пропуск дефектов")
                    .category("Качество")
                    .build(),
            ProjectRisk.builder()
                    .id(8L).position(8)
                    .title("Риски информационной безопасности")
                    .description("Утечка данных или несанкционированный доступ")
                    .category("Безопасность")
                    .build(),
            ProjectRisk.builder()
                    .id(9L).position(9)
                    .title("Конфликты в команде")
                    .description("Разногласия между участниками проекта снижают эффективность")
                    .category("Команда")
                    .build(),
            ProjectRisk.builder()
                    .id(10L).position(10)
                    .title("Недоступность стейкхолдеров")
                    .description("Ключевые участники не могут своевременно принимать решения")
                    .category("Управление")
                    .build()
    ));

    public List<ProjectRisk> getRisks() {
        return risks.stream()
                .sorted(Comparator.comparingInt(ProjectRisk::getPosition))
                .toList();
    }

    public List<ProjectRisk> reorder(List<Long> orderedIds) {
        for (int index = 0; index < orderedIds.size(); index++) {
            Long id = orderedIds.get(index);
            int position = index + 1;

            risks.stream()
                    .filter(risk -> risk.getId().equals(id))
                    .findFirst()
                    .ifPresent(risk -> risk.setPosition(position));
        }

        return getRisks();
    }
}
