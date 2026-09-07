export function normalizePositionsInTab(tabEL) {
    const rows = Array.from(tabEL.querySelectorAll('.editable-row:not([data-template])'));
    if (rows.length === 0) return;

    // Сортируем по исходному порядку
    rows.sort((a, b) => {
        const initA = parseInt(a.getAttribute('data-initial-position'), 10) || 9999;
        const initB = parseInt(b.getAttribute('data-initial-position'), 10) || 9999;
        return initA - initB;
    });

    // ШАГ 1: Собираем все желаемые позиции
    const desiredPositions = new Map();
    const maxPosition = rows.length;

    rows.forEach((row) => {
        const posInput = row.querySelector('input[name="position"]');
        if (!posInput) return;

        let desiredPos = parseInt(posInput.value, 10);

        // Если пользователь ничего не ввел или ввел мусор, берем индекс + 1
        if (isNaN(desiredPos) || desiredPos <= 0) {
            desiredPos = row._originalIndex || rows.indexOf(row) + 1;
        }

        // Ограничиваем позицию максимальным значением
        if (desiredPos > maxPosition) {
            desiredPos = maxPosition;
        }

        desiredPositions.set(row, desiredPos);
    });

    // ШАГ 2: Проверяем конфликты и разрешаем их
    const usedPositions = new Set();
    const rowsByDesiredPos = new Map();

    // Группируем строки по желаемым позициям
    desiredPositions.forEach((pos, row) => {
        if (!rowsByDesiredPos.has(pos)) {
            rowsByDesiredPos.set(pos, []);
        }
        rowsByDesiredPos.get(pos).push(row);
    });

    // ШАГ 3: Разрешаем конфликты сдвигом
    const assignedPositions = new Map();

    // Сортируем позиции по возрастанию
    const sortedPositions = Array.from(rowsByDesiredPos.keys()).sort((a, b) => a - b);

    sortedPositions.forEach(pos => {
        const rowsAtThisPos = rowsByDesiredPos.get(pos);

        if (rowsAtThisPos.length === 1) {
            // Если только одна строка на позиции, проверяем, свободна ли она
            let assignedPos = pos;
            while (usedPositions.has(assignedPos)) {
                assignedPos++;
            }
            assignedPositions.set(rowsAtThisPos[0], assignedPos);
            usedPositions.add(assignedPos);
        } else {
            // Если несколько строк на одной позиции
            // Сортируем их по исходному порядку
            rowsAtThisPos.sort((a, b) => {
                const initA = parseInt(a.getAttribute('data-initial-position'), 10) || 9999;
                const initB = parseInt(b.getAttribute('data-initial-position'), 10) || 9999;
                return initA - initB;
            });

            // Первая строка получает желаемую позицию
            let currentPos = pos;
            rowsAtThisPos.forEach((row, index) => {
                // Проверяем, что позиция свободна
                while (usedPositions.has(currentPos)) {
                    currentPos++;
                }
                // Если это не первая строка, и позиция совпадает с pos, двигаем дальше
                if (index > 0 && currentPos === pos) {
                    currentPos++;
                    while (usedPositions.has(currentPos)) {
                        currentPos++;
                    }
                }
                assignedPositions.set(row, currentPos);
                usedPositions.add(currentPos);
                currentPos++;
            });
        }
    });

    // ШАГ 4: Применяем новые позиции
    assignedPositions.forEach((newPos, row) => {
        const posInput = row.querySelector('input[name="position"]');
        if (posInput) {
            posInput.value = newPos;
        }
        row.setAttribute('data-initial-position', newPos);
    });

    // Дополнительно: обновляем data-initial-position для всех строк в правильном порядке
    const allRows = tabEL.querySelectorAll('.editable-row:not([data-template])');
    const sortedRows = Array.from(allRows).sort((a, b) => {
        const posA = parseInt(a.getAttribute('data-initial-position'), 10) || 9999;
        const posB = parseInt(b.getAttribute('data-initial-position'), 10) || 9999;
        return posA - posB;
    });

    sortedRows.forEach((row, index) => {
        const posInput = row.querySelector('input[name="position"]');
        if (posInput) {
            // Исправляем возможные разрывы в позициях
            const currentPos = parseInt(posInput.value, 10);
            // Проверяем, что позиция соответствует порядку
            if (currentPos !== index + 1) {
                // Если есть разрывы, переназначаем
                posInput.value = index + 1;
                row.setAttribute('data-initial-position', index + 1);
            }
        }
    });

    console.log('Позиции нормализованы (с сохранением предпочтений пользователя)');
}