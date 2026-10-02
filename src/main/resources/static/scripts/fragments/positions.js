// Двухуровневые позиции: "1" (основной пункт) и "1.1" (подпункт).
// "1.10" — это НЕ "1.1": первая часть — основной номер, вторая — номер подпункта.
// Сравниваем части как числа, а не как дробь: 1.9 < 1.10 < 1.11.

export function parsePosition(value) {
    const text = String(value ?? '').trim();
    if (!text) return [0, 0];
    const parts = text.split('.');
    const major = parseInt(parts[0], 10);
    const minor = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    if (!Number.isFinite(major) || !Number.isFinite(minor) || major < 1 || minor < 0) {
        return [0, 0];
    }
    return [major, minor];
}

// Двухуровневое сравнение: 1 < 1.1 < 1.2 < 1.10 < 2
export function comparePositions(a, b) {
    const [aMaj, aMin] = parsePosition(a);
    const [bMaj, bMin] = parsePosition(b);
    if (aMaj !== bMaj) return aMaj - bMaj;
    return aMin - bMin;
}

// Пересчёт по УЖЕ ЗАДАННОМУ порядку (drag-and-drop):
// мажоры (без точки) нумеруются подряд 1, 2, 3... в порядке появления;
// подпункт (X.Y) принадлежит ПОСЛЕДНЕМУ мажору перед ним и нумеруется подряд внутри него:
// [1, 1.1, 1.2, 2, 2.1, 1.1-перенесённый] → [1, 1.1, 1.2, 2, 2.1, 2.2]
export function renumberTwoLevel(entries) {
    let majorCounter = 0;
    let lastMajor = 0;
    let minorCounter = 0;

    return entries.map((entry) => {
        const [, minor] = parsePosition(entry.position);
        let label;

        if (minor === 0) {
            majorCounter++;
            lastMajor = majorCounter;
            minorCounter = 0;
            label = String(majorCounter);
        } else {
            if (lastMajor === 0) {
                majorCounter++;
                lastMajor = majorCounter;
                minorCounter = 0;
            }
            minorCounter++;
            label = lastMajor + '.' + minorCounter;
        }

        return {...entry, position: label};
    });
}

// Пересчёт по ЖЕЛАЕМЫМ значениям (ввод в полях):
// сортируем по двухуровневой позиции и перенумеровываем.
export function renumberPositions(entries) {
    const sorted = entries
        .map((entry, index) => ({entry, index}))
        .sort((a, b) => {
            const cmp = comparePositions(a.entry.position, b.entry.position);
            return cmp !== 0 ? cmp : a.index - b.index;
        })
        .map(item => item.entry);

    return renumberTwoLevel(sorted);
}

// Нормализация позиций в таблице редактирования.
// Читает input[name="position"], сортирует, перенумеровывает с учётом 2 уровней
// и записывает результат обратно в inputs и data-initial-position.
// Возвращает массив {element, position} в новом порядке.
export function normalizePositionsInTab(tabEL) {
    const rows = Array.from(tabEL.querySelectorAll('.editable-row:not([data-template])'));
    if (rows.length === 0) return [];

    rows.forEach((row, index) => {
        if (!row.hasAttribute('data-initial-position')) {
            row.setAttribute('data-initial-position', String(index + 1));
        }
    });

    const entries = rows.map(row => {
        const posInput = row.querySelector('input[name="position"]');
        const raw = posInput?.value?.trim() || '';
        const position = parsePosition(raw)[0] > 0
            ? raw
            : row.getAttribute('data-initial-position');
        return {row, position};
    });

    const renumbered = renumberPositions(entries);

    renumbered.forEach((item) => {
        item.row.setAttribute('data-initial-position', item.position);
        const posInput = item.row.querySelector('input[name="position"]');
        if (posInput) {
            posInput.value = item.position;
        }
    });

    return renumbered.map(item => ({
        element: item.row,
        position: item.position
    }));
}