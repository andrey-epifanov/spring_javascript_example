import { enableColumnSortingLevel2 } from './sort_utils.js';
import { initializeSortingLevel2 } from './main_sort_init.js';

const API_URL = '/api/goals';
const tbody = document.getElementById('goal-body');
const addBtn = document.getElementById('addGoalBtn');
const saveBtn = document.getElementById('saveGoalsBtn');
const statusText = document.getElementById('goalStatusText');

// Опции статусов берём из серверного inline-скрипта (window.__GOAL_STATUSES__),
// который формирует EnumHelpController через @ModelAttribute goalStatuses.
// Если inline-скрипт ещё не выполнился — читаем из DOM.
const STATUS_OPTIONS = (Array.isArray(window.__GOAL_STATUSES__) && window.__GOAL_STATUSES__.length > 0
        ? window.__GOAL_STATUSES__
        : Array.from(document.querySelectorAll('select[name="status"] option')).map(option => option.value))
    .map(value => ({value, text: value}));

let nextId = 0;

function createRow(goal = {}) {
    const tr = document.createElement('tr');
    tr.dataset.position = goal.position || '';
    tr.dataset.id = goal.id || `new-${++nextId}`;

    const cells = [
        {name: 'position', value: goal.position || '', cls: 'position-input'},
        {name: 'measured', value: goal.measured || '', cls: 'goal-input'},
        {name: 'currentValue', value: goal.currentValue || '', cls: 'goal-input'},
        {name: 'responsible', value: goal.responsible || '', cls: 'goal-input'}
    ];

    const statusCell = document.createElement('td');
    const statusSelect = document.createElement('select');
    statusSelect.name = 'status';
    statusSelect.className = 'goal-input';
    STATUS_OPTIONS.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        statusSelect.appendChild(opt);
    });
    if (goal.status) {
        statusSelect.value = goal.status;
    }
    statusCell.appendChild(statusSelect);
    cells.push({element: statusCell});

    cells.forEach(cell => {
        const td = document.createElement('td');
        if (cell.name) {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = cell.name;
            input.value = cell.value;
            input.className = cell.cls;
            td.appendChild(input);
        } else {
            td.appendChild(cell.element);
        }
        tr.appendChild(td);
    });

    return tr;
}

function collectGoals() {
    return Array.from(tbody.querySelectorAll('tr')).map(tr => {
        const goal = {
            id: tr.dataset.id,
            position: tr.querySelector('input[name="position"]')?.value || '',
            measured: tr.querySelector('input[name="measured"]')?.value || '',
            currentValue: tr.querySelector('input[name="currentValue"]')?.value || '',
            responsible: tr.querySelector('input[name="responsible"]')?.value || '',
            status: tr.querySelector('select[name="status"]')?.value || ''
        };
        // id new-* → null (добавление)
        if (String(goal.id).startsWith('new-')) {
            goal.id = null;
        }
        return goal;
    });
}

async function saveGoals() {
    statusText.textContent = 'Сохранение...';
    saveBtn.disabled = true;
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(collectGoals())
        });
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        const saved = await response.json();
        applySavedIds(saved);
        statusText.textContent = 'Изменения сохранены';
        statusText.classList.remove('error');
    } catch (error) {
        statusText.textContent = 'Ошибка: ' + error.message;
        statusText.classList.add('error');
    } finally {
        saveBtn.disabled = false;
    }
}

// После сохранения обновляем id у новых строк, сохраняя текущий порядок DOM
// (добавленная цель остаётся сверху, а не уезжает по сортировке).
function applySavedIds(saved) {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.forEach(row => {
        if (!String(row.dataset.id || '').startsWith('new-')) return;
        const value = key => row.querySelector('input[name="' + key + '"]')?.value || '';
        const statusValue = row.querySelector('select[name="status"]')?.value || '';
        const match = saved.find(g =>
            g.position === value('position') &&
            g.measured === value('measured') &&
            g.currentValue === value('currentValue') &&
            g.responsible === value('responsible') &&
            g.status === statusValue
        );
        if (match) {
            row.dataset.id = match.id;
        }
    });
}

async function renderGoals(goals) {
    tbody.innerHTML = '';
    goals.forEach(goal => {
        tbody.appendChild(createRow(goal));
    });
}

async function loadGoals() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        await renderGoals(await response.json());
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5">Не удалось загрузить данные</td></tr>';
        statusText.textContent = 'Ошибка загрузки: ' + error.message;
        statusText.classList.add('error');
    }
}

// Инициализация сортировки (4 режима по клику на №)
initializeSortingLevel2();

addBtn.addEventListener('click', () => {
    // Новую цель вставляем первой строкой
    tbody.prepend(createRow());
    statusText.textContent = 'Добавьте значения в новую строку';
    statusText.classList.remove('error');
});

saveBtn.addEventListener('click', saveGoals);

loadGoals();