import { escapeHtml } from './html-utils.js';

const API_URL = '/api/risks';
const REORDER_URL = '/api/risks/reorder';
const tableBody = document.getElementById('riskTableBody');
const statusText = document.getElementById('riskStatusText');

let risks = [];
let draggedRiskId = null;

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

function renderRiskTable() {
    if (risks.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">Нет данных</td></tr>';
        return;
    }

    tableBody.innerHTML = risks.map(risk => `
        <tr data-id="${risk.id}" class="risk-row">
            <td class="position-cell" draggable="true" title="Перетащите для изменения порядка">
                <span class="position-handle">${risk.position}</span>
            </td>
            <td>${escapeHtml(risk.title)}</td>
            <td>${escapeHtml(risk.description)}</td>
            <td><span class="category-badge">${escapeHtml(risk.category)}</span></td>
        </tr>
    `).join('');

    tableBody.querySelectorAll('.position-cell').forEach(cell => {
        cell.addEventListener('dragstart', handleDragStart);
        cell.addEventListener('dragend', handleDragEnd);
    });

    tableBody.querySelectorAll('.risk-row').forEach(row => {
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('drop', handleDrop);
    });
}

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
    risks = risks.map((risk, index) => ({...risk, position: index + 1}));

    renderRiskTable();

    try {
        const response = await fetch(REORDER_URL, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(risks.map(risk => risk.id))
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

loadRisks();
