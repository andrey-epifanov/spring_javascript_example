package com.example.hierarchy.service;

import com.example.hierarchy.model.ProjectRisk;
import com.example.hierarchy.model.RiskReorderItem;
import com.example.hierarchy.model.RiskUpdateDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class RiskService {

    private final List<ProjectRisk> risks = new ArrayList<>(List.of(
            ProjectRisk.builder()
                    .id(1L).position("1")
                    .title("Превышение бюджета")
                    .description("Фактические затраты могут превысить утверждённый бюджет проекта")
                    .category("Финансовый")
                    .build(),
            ProjectRisk.builder()
                    .id(2L).position("2")
                    .title("Срыв сроков")
                    .description("Задержки на этапах разработки или согласований")
                    .category("Сроки")
                    .build(),
            ProjectRisk.builder()
                    .id(3L).position("3")
                    .title("Нехватка ресурсов")
                    .description("Недостаток квалифицированных специалистов в команде")
                    .category("Ресурсы")
                    .build(),
            ProjectRisk.builder()
                    .id(4L).position("4")
                    .title("Изменение требований")
                    .description("Заказчик может менять требования в процессе работ")
                    .category("Объём работ")
                    .build(),
            ProjectRisk.builder()
                    .id(5L).position("5")
                    .title("Проблемы интеграции")
                    .description("Сложности при интеграции с внешними системами")
                    .category("Технический")
                    .build(),
            ProjectRisk.builder()
                    .id(6L).position("6")
                    .title("Зависимость от подрядчиков")
                    .description("Задержки или некачественная работа внешних подрядчиков")
                    .category("Внешний")
                    .build(),
            ProjectRisk.builder()
                    .id(7L).position("7")
                    .title("Низкое качество тестирования")
                    .description("Недостаточное покрытие тестами и пропуск дефектов")
                    .category("Качество")
                    .build(),
            ProjectRisk.builder()
                    .id(8L).position("8")
                    .title("Риски информационной безопасности")
                    .description("Утечка данных или несанкционированный доступ")
                    .category("Безопасность")
                    .build(),
            ProjectRisk.builder()
                    .id(9L).position("9")
                    .title("Конфликты в команде")
                    .description("Разногласия между участниками проекта снижают эффективность")
                    .category("Команда")
                    .build(),
            ProjectRisk.builder()
                    .id(10L).position("10")
                    .title("Недоступность стейкхолдеров")
                    .description("Ключевые участники не могут своевременно принимать решения")
                    .category("Управление")
                    .build(),
            ProjectRisk.builder()
                    .id(11L).position("1.1")
                    .title("Дополнительный риск 1.1")
                    .description("Двухуровневый пункт, номер и название редактируются в режиме редактирования")
                    .category("Дополнительный")
                    .build(),
            ProjectRisk.builder()
                    .id(12L).position("1.2")
                    .title("Дополнительный риск 1.2")
                    .description("Двухуровневый пункт, номер и название редактируются в режиме редактирования")
                    .category("Дополнительный")
                    .build(),
            ProjectRisk.builder()
                    .id(13L).position("4.1")
                    .title("Дополнительный риск 4.1")
                    .description("Двухуровневый пункт, номер и название редактируются в режиме редактирования")
                    .category("Дополнительный")
                    .build()
    ));

    public List<ProjectRisk> getRisks() {
        Comparator<ProjectRisk> twoLevel = Comparator
                .comparingInt((ProjectRisk risk) -> parsePosition(risk.getPosition())[0])
                .thenComparingInt(risk -> parsePosition(risk.getPosition())[1]);
        return risks.stream()
                .sorted(twoLevel)
                .toList();
    }

    public List<ProjectRisk> reorder(List<RiskReorderItem> items) {
        for (RiskReorderItem item : items) {
            if (item.getId() == null) {
                continue;
            }
            risks.stream()
                    .filter(risk -> risk.getId().equals(item.getId()))
                    .findFirst()
                    .ifPresent(risk -> risk.setPosition(item.getPosition()));
        }

        renumberTwoLevel();
        return getRisks();
    }

    /**
     * Двухуровневый пересчёт позиций по текущему порядку (после двухуровневой сортировки):
     * мажоры (без точки) нумеруются подряд 1, 2, 3... в порядке появления;
     * подпункт (X.Y) принадлежит ПОСЛЕДНЕМУ мажору перед ним и нумеруется подряд внутри него.
     */
    private void renumberTwoLevel() {
        int majorCounter = 0;
        int lastMajor = 0;
        int minorCounter = 0;

        for (ProjectRisk risk : getRisks()) {
            int[] parts = parsePosition(risk.getPosition());
            if (parts[1] == 0) {
                majorCounter++;
                lastMajor = majorCounter;
                minorCounter = 0;
                risk.setPosition(String.valueOf(majorCounter));
            } else {
                if (lastMajor == 0) {
                    majorCounter++;
                    lastMajor = majorCounter;
                    minorCounter = 0;
                }
                minorCounter++;
                risk.setPosition(lastMajor + "." + minorCounter);
            }
        }
    }

    public ProjectRisk updateRisk(Long id, RiskUpdateDto dto) {
        ProjectRisk risk = risks.stream()
                .filter(item -> item.getId().equals(id))
                .findFirst()
                .orElse(null);
        if (risk == null) {
            return null;
        }

        if (dto.getPosition() != null) {
            risk.setPosition(dto.getPosition());
        }
        if (dto.getTitle() != null) {
            risk.setTitle(dto.getTitle());
        }

        return risk;
    }

    public static int[] parsePosition(String position) {
        if (position == null || position.isBlank()) {
            return new int[]{0, 0};
        }
        String[] parts = position.trim().split("\\.");
        try {
            int major = Integer.parseInt(parts[0].trim());
            int minor = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : 0;
            return new int[]{major, minor};
        } catch (NumberFormatException e) {
            return new int[]{0, 0};
        }
    }
}
