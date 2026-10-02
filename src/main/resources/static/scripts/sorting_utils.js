// Двухуровневая сортировка по position вида "1", "1.1", "1.10".
// Клик по заголовку № переключает 4 режима (2 уровня × 2 направления):
//   1. major ↑, minor ↑  — 1, 1.1, 1.2, 2, 2.1
//   2. major ↑, minor ↓  — 1, 1.2, 1.1, 2, 2.2, 2.1
//   3. major ↓, minor ↑  — 2, 2.1, 1, 1.1, 1.2
//   4. major ↓, minor ↓  — 2, 2.2, 2.1, 1, 1.2, 1.1

export const SORT_MODES = [
    'major-asc-minor-asc',
    'major-asc-minor-desc',
    'major-desc-minor-asc',
    'major-desc-minor-desc'
];

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

export function compareByPosition(a, b, mode = SORT_MODES[0]) {
    const [aMaj, aMin] = parsePosition(a.position ?? a);
    const [bMaj, bMin] = parsePosition(b.position ?? b);

    let majorCmp = aMaj - bMaj;
    if (mode.startsWith('major-desc')) {
        majorCmp = -majorCmp;
    }
    if (majorCmp !== 0) return majorCmp;

    let minorCmp = aMin - bMin;
    if (mode.endsWith('minor-desc')) {
        minorCmp = -minorCmp;
    }
    return minorCmp;
}

export function sortByPosition(items, mode = SORT_MODES[0]) {
    return [...items].sort((a, b) => compareByPosition(a, b, mode));
}

export function nextSortMode(mode) {
    const index = SORT_MODES.indexOf(mode);
    return SORT_MODES[(index + 1) % SORT_MODES.length];
}

export function getSortModeIndex(mode) {
    return SORT_MODES.indexOf(mode);
}

export function getSortArrows(mode) {
    const majorUp = mode.startsWith('major-asc');
    const minorUp = mode.endsWith('minor-asc');
    return {
        major: majorUp ? '▲' : '▼',
        minor: minorUp ? '▲' : '▼'
    };
}
