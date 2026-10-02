import { escapeHtml } from './html-utils.js';
import { normalizePositionsInTab, renumberTwoLevel } from './fragments/positions.js';
import { SORT_MODES, sortByPosition, nextSortMode, getSortArrows } from './sorting_utils.js';

const API_URL = '/api/risks';
const REORDER_URL = '/api/risks/reorder';
const tableBody = document.getElementById('riskTableBody');
const statusText = document.getElementById('riskStatusText');
const editModeBtn = document.getElementById('editModeBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const editToolbar = document.getElementById('editToolbar');
const positionHeader = document.getElementById('positionHeader');
const sortIndicator = document.getElementById('sortIndicator');

let risks = [];
let draggedRiskId = null;
let editMode = false;
let sortMode = SORT_MODES[0];

// --- Управление режимом редактирования ---

function sortedRisks() {
    return sortByPosition(risks, sortMode);
}

function updateSortIndicator() {
    if (!sortIndicator) return;
    const arrows = getSortArrows(sortMode);
    sortIndicator.textContent = (arrows.major + arrows.minor);
    positionHeader?.setAttribute('data-sort-mode', sortMode);
}

function handleSortClick() {
    sortMode = nextSortMode(sortMode);
    updateSortIndicator();
    renderRiskTable();
    statusText.textContent = 'Сортировка: ' + sortMode.replaceAll('-', ' ');
}

function setEditMode(enabled) {
    editMode = enabled;
    document.body.classList.toggle('edit-in-progress', enabled);
    editToolbar.classList.toggle('hidden', !enabled);
    editModeBtn.classList.toggle('hidden', enabled);
    renderRiskTable();
}

function collectForReorder() {
    // Возвращает [{id, position}] в текущем DOM-порядке (после перенумерации)
    const rows = Array.from(tableBody.querySelectorAll('.editable-row:not([data-template])'));
    return rows.map(row => ({
        id: Number(row.dataset.id),
        position: row.querySelector('input[name="position"]')?.value?.trim() || ''
    }));
}

function collectEdits() {
    const rows = Array.from(tableBody.querySelectorAll('.editable-row:not([data-template])'));
    return rows.map(row => ({
        id: Number(row.dataset.id),
        position: row.querySelector('input[name="position"]')?.value?.trim() || '',
        title: row.querySelector('input[name="title"]')?.value?.trim() || ''
    }));
}

async function saveEdits() {
    saveBtn.disabled = true;
    try {
        // 1. Нормализуем позиции по 2-уровневому алгоритму
        normalizePositionsInTab(tableBody);

        // 2. Сохраняем позиции (reorder с двухуровневыми номерами)
        const reorderResponse = await fetch(REORDER_URL, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(collectForReorder())
        });
        if (!reorderResponse.ok) {
            throw new Error('Ошибка сохранения позиций (HTTP ' + reorderResponse.status + ')');
        }

        // 3. Сохраняем названия (позиции уже сохранены шагом 2)
        const edits = collectEdits();
        for (const edit of edits) {
            const response = await fetch(API_URL + '/' + edit.id, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({title: edit.title})
            });
            if (!response.ok) {
                throw new Error('Ошибка сохранения риска ' + edit.id);
            }
        }

        // 4. Перезагружаем список
        await loadRisks();
        setEditMode(false);
        statusText.textContent = 'Изменения сохранены';
        statusText.classList.remove('error');
    } catch (error) {
        statusText.textContent = 'Ошибка: ' + error.message;
        statusText.classList.add('error');
    } finally {
        saveBtn.disabled = false;
    }
}

async function cancelEdits() {
    setEditMode(false);
    await loadRisks();
    statusText.textContent = 'Изменения отменены';
}

// --- Загрузка и рендер ---

async function loadRisks() {
    statusText.textContent = 'Загрузка...';
    statusText.classList.remove('error');

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }

        risks = await response.json();
        renderRiskTable();
        statusText.textContent = 'Рисков в списке: ' + risks.length;
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="4">Не удалось загрузить данные</td></tr>';
        statusText.textContent = 'Ошибка: ' + error.message;
        statusText.classList.add('error');
    }
}

function riskRowTemplate(risk) {
    if (editMode) {
        return `
        <tr data-id="${risk.id}" class="editable-row">
            <td class="position-cell">
                <input type="text" name="position" value="${escapeHtml(risk.position)}" class="position-input">
            </td>
            <td>
                <input type="text" name="title" value="${escapeHtml(risk.title)}" class="title-input">
            </td>
            <td>${escapeHtml(risk.description)}</td>
            <td><span class="category-badge">${escapeHtml(risk.category)}</span></td>
        </tr>
        `;
    }

    return `
        <tr data-id="${risk.id}" class="risk-row">
            <td class="position-cell" draggable="true" title="Перетащите для изменения порядка">
                <span class="position-handle">${escapeHtml(risk.position)}</span>
            </td>
            <td>${escapeHtml(risk.title)}</td>
            <td>${escapeHtml(risk.description)}</td>
            <td><span class="category-badge">${escapeHtml(risk.category)}</span></td>
        </tr>
    `;
}

function renderRiskTable() {
    if (risks.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">Нет данных</td></tr>';
        return;
    }

    tableBody.innerHTML = sortedRisks().map(riskRowTemplate).join('');

    if (editMode) {
        tableBody.querySelectorAll('.editable-row').forEach(row => {
            const posInput = row.querySelector('input[name="position"]');
            const titleInput = row.querySelector('input[name="title"]');
            posInput?.addEventListener('input', () => highlightPositionRow(row));
            titleInput?.addEventListener('input', () => highlightPositionRow(row));
        });
        return;
    }

    tableBody.querySelectorAll('.position-cell').forEach(cell => {
        cell.addEventListener('dragstart', handleDragStart);
        cell.addEventListener('dragend', handleDragEnd);
    });

    tableBody.querySelectorAll('.risk-row').forEach(row => {
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('drop', handleDrop);
    });
}

function highlightPositionRow(row) {
    row.classList.add('edited-row');
}

// --- Drag-and-drop ---

function handleDragStart(event) {
    const row = event.target.closest('.risk-row');
    draggedRiskId = Number(row.dataset.id);
    row.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(draggedRiskId));
}

function handleDragEnd(event) {
    event.target.closest('.risk-row')?.classList.remove('dragging');
    tableBody.querySelectorAll('.risk-row').forEach(row => row.classList.remove('drag-over'));
    draggedRiskId = null;
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const row = event.currentTarget;
    tableBody.querySelectorAll('.risk-row').forEach(item => item.classList.remove('drag-over'));

    if (Number(row.dataset.id) !== draggedRiskId) {
        row.classList.add('drag-over');
    }
}

async function handleDrop(event) {
    event.preventDefault();

    const targetRow = event.currentTarget;
    const targetId = Number(targetRow.dataset.id);
    tableBody.querySelectorAll('.risk-row').forEach(row => row.classList.remove('drag-over'));

    if (!draggedRiskId || draggedRiskId === targetId) {
        return;
    }

    const draggedIndex = risks.findIndex(risk => risk.id === draggedRiskId);
    const targetIndex = risks.findIndex(risk => risk.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
        return;
    }

    const [movedRisk] = risks.splice(draggedIndex, 1);
    risks.splice(targetIndex, 0, movedRisk);

    // Пересчитываем двухуровневые позиции по новому порядку (1, 1.1, 1.2, 2, ...)
    risks = renumberTwoLevel(risks);
    renderRiskTable();

    try {
        const payload = risks.map(risk => ({id: risk.id, position: risk.position}));
        const response = await fetch(REORDER_URL, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }

        risks = await response.json();
        renderRiskTable();
        statusText.textContent = 'Порядок обновлён. Рисков в списке: ' + risks.length;
        statusText.classList.remove('error');
    } catch (error) {
        statusText.textContent = 'Ошибка сохранения порядка: ' + error.message;
        statusText.classList.add('error');
        await loadRisks();
    }
}

// --- Инициализация ---

const refreshBtn = document.getElementById('refreshBtn');

editModeBtn.addEventListener('click', () => setEditMode(true));
saveBtn.addEventListener('click', saveEdits);
cancelBtn.addEventListener('click', cancelEdits);
refreshBtn?.addEventListener('click', () => {
    setEditMode(false);
    loadRisks();
});
positionHeader?.addEventListener('click', handleSortClick);

updateSortIndicator();
loadRisks();
