export function normalizePositionsInTab(tabEL) {
    const rows = Array.from(tabEL.querySelectorAll('.editable-row:not([data-template])'));
    if (rows.length === 0) return;

    // Сохраняем исходный порядок
    rows.forEach((row, index) => {
        if (!row.hasAttribute('data-initial-position')) {
            row.setAttribute('data-initial-position', index + 1);
        }
    });

    // ШАГ 1: Собираем все желаемые позиции
    const desiredPositions = new Map();
    const maxPosition = rows.length;

    rows.forEach((row) => {
        const posInput = row.querySelector('input[name="position"]');
        if (!posInput) {
            desiredPositions.set(row, parseInt(row.getAttribute('data-initial-position'), 10) || rows.indexOf(row) + 1);
            return;
        }

        let desiredPos = parseInt(posInput.value, 10);

        // Валидация ввода
        if (isNaN(desiredPos) || desiredPos < 1) {
            desiredPos = parseInt(row.getAttribute('data-initial-position'), 10) || rows.indexOf(row) + 1;
        }

        // Ограничиваем позицию
        desiredPos = Math.min(Math.max(desiredPos, 1), maxPosition);

        desiredPositions.set(row, desiredPos);
    });

    // ШАГ 2: Разрешаем конфликты с помощью алгоритма "заполнения пробелов"
    const usedPositions = new Set();
    const finalPositions = new Map();

    // Сортируем строки по желаемой позиции, затем по исходной
    const sortedRows = Array.from(rows).sort((a, b) => {
        const posA = desiredPositions.get(a) || 9999;
        const posB = desiredPositions.get(b) || 9999;
        if (posA !== posB) return posA - posB;

        const initA = parseInt(a.getAttribute('data-initial-position'), 10) || 9999;
        const initB = parseInt(b.getAttribute('data-initial-position'), 10) || 9999;
        return initA - initB;
    });

    // Распределяем позиции
    sortedRows.forEach((row) => {
        const desiredPos = desiredPositions.get(row) || 1;
        let assignedPos = desiredPos;

        // Ищем свободную позицию
        while (usedPositions.has(assignedPos)) {
            assignedPos++;
        }

        // Если вышли за пределы, ищем свободную позицию сначала
        if (assignedPos > maxPosition) {
            assignedPos = 1;
            while (usedPositions.has(assignedPos)) {
                assignedPos++;
            }
        }

        finalPositions.set(row, assignedPos);
        usedPositions.add(assignedPos);
    });

    // ШАГ 3: Применяем позиции
    finalPositions.forEach((newPos, row) => {
        const posInput = row.querySelector('input[name="position"]');
        if (posInput) {
            posInput.value = newPos;
        }
        row.setAttribute('data-initial-position', newPos);
    });

    // ШАГ 4: Дополнительная нормализация (убираем разрывы)
    const sortedByPosition = Array.from(rows).sort((a, b) => {
        const posA = parseInt(a.getAttribute('data-initial-position'), 10) || 9999;
        const posB = parseInt(b.getAttribute('data-initial-position'), 10) || 9999;
        return posA - posB;
    });

    sortedByPosition.forEach((row, index) => {
        const newPos = index + 1;
        const currentPos = parseInt(row.getAttribute('data-initial-position'), 10);

        if (currentPos !== newPos) {
            const posInput = row.querySelector('input[name="position"]');
            if (posInput) {
                posInput.value = newPos;
            }
            row.setAttribute('data-initial-position', newPos);
        }
    });

    console.log('✅ Позиции нормализованы');
    return Array.from(rows).map(row => ({
        element: row,
        position: parseInt(row.getAttribute('data-initial-position'), 10)
    }));
}