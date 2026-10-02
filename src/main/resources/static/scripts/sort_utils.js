// Двухуровневая сортировка по position вида "1", "1.1", "1.10".
// Клик по заголовку переключает 4 режима (major/minor × asc/desc):
//   1. major ↑, minor ↑
//   2. major ↑, minor ↓
//   3. major ↓, minor ↑
//   4. major ↓, minor ↓

const SORT_MODES = [
    'major-asc-minor-asc',
    'major-asc-minor-desc',
    'major-desc-minor-asc',
    'major-desc-minor-desc'
];

const ARROWS = {
    'major-asc-minor-asc': '▲▲',
    'major-asc-minor-desc': '▲▼',
    'major-desc-minor-asc': '▼▲',
    'major-desc-minor-desc': '▼▼'
};

function parsePosition(value) {
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

function nextSortMode(mode) {
    const index = SORT_MODES.indexOf(mode);
    return SORT_MODES[(index + 1) % SORT_MODES.length];
}

function compareByPosition(a, b, mode) {
    const [aMaj, aMin] = parsePosition(a);
    const [bMaj, bMin] = parsePosition(b);

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

export function enableColumnSortingLevel2() {
    document.querySelectorAll('th[data-type=table]').forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.dataset.sort;
            const tbodyId = th.dataset.tbody;
            const tbody = document.getElementById(tbodyId);
            if (!tbody) return;

            // Текущий режим хранится на th (по умолчанию первый)
            const currentMode = th.dataset.sortMode || SORT_MODES[0];
            const nextMode = nextSortMode(currentMode);
            th.dataset.sortMode = nextMode;

            // Сбрасываем стрелки у соседей в той же таблице
            const table = th.closest('table');
            table.querySelectorAll('th[data-type=table]').forEach(other => {
                if (other !== th) {
                    other.classList.remove('sort-asc', 'sort-desc');
                    other.dataset.sortMode = '';
                }
            });

            th.classList.remove('sort-asc', 'sort-desc');
            th.classList.add(nextMode.startsWith('major-asc') ? 'sort-asc' : 'sort-desc');

            const arrow = th.querySelector('.sort-arrow');
            if (arrow) {
                arrow.textContent = ARROWS[nextMode];
            }

            const rows = Array.from(tbody.querySelectorAll('tr'));

            rows.sort((rowA, rowB) => {
                if (sortKey === 'position') {
                    const valA = rowA.querySelector('[data-position]')?.dataset.position
                        || rowA.querySelector('td:first-child')?.textContent.trim()
                        || rowA.querySelector('input[name="position"]')?.value
                        || '';
                    const valB = rowB.querySelector('[data-position]')?.dataset.position
                        || rowB.querySelector('td:first-child')?.textContent.trim()
                        || rowB.querySelector('input[name="position"]')?.value
                        || '';
                    return compareByPosition(valA, valB, nextMode);
                }

                const valA = rowA.querySelector('input[name="' + sortKey + '"]')?.value
                    || rowA.querySelector('td:nth-child(' + columnIndex(th) + ')')?.textContent.trim()
                    || '';
                const valB = rowB.querySelector('input[name="' + sortKey + '"]')?.value
                    || rowB.querySelector('td:nth-child(' + columnIndex(th) + ')')?.textContent.trim()
                    || '';
                return valA.localeCompare(valB, 'ru');
            });

            rows.forEach(row => tbody.appendChild(row));
        });
    });
}

function columnIndex(th) {
    const headers = Array.from(th.parentElement.children);
    return headers.indexOf(th) + 1;
}
