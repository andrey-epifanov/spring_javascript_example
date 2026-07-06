import { renderTable } from './employee-additional.js';

const API_URL = '/api/employees/tree';
const DEPARTMENTS_API_URL = '/api/employees/departments';
const tableBody = document.getElementById('employeeTableBody');
const statusText = document.getElementById('statusText');
const nameFilterInput = document.getElementById('nameFilterInput');
const departmentFilterSelect = document.getElementById('departmentFilterSelect');
const positionFilterSelect = document.getElementById('positionFilterSelect');

let flatRows = [];
let collapsedIds = new Set();

async function loadEmployees() {
    statusText.textContent = 'Загрузка...';
    statusText.classList.remove('error');

    try {
        const [employeesResponse, departmentsResponse] = await Promise.all([
            fetch(API_URL),
            fetch(DEPARTMENTS_API_URL)
        ]);

        if (!employeesResponse.ok) {
            throw new Error('HTTP ' + employeesResponse.status);
        }
        if (!departmentsResponse.ok) {
            throw new Error('HTTP ' + departmentsResponse.status);
        }

        const data = await employeesResponse.json();
        const departments = await departmentsResponse.json();
        flatRows = flattenTree(data);
        collapsedIds = new Set(
            flatRows.filter(row => row.hasChildren).map(row => row.id)
        );
        fillSelectFilter(departmentFilterSelect, departments, 'Все отделы');
        fillSelectFilter(positionFilterSelect, flatRows.map(row => row.position), 'Все должности');
        renderCurrentTable();
        statusText.textContent = 'Загружено записей: ' + flatRows.length;
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="4">Не удалось загрузить данные</td></tr>';
        statusText.textContent = 'Ошибка: ' + error.message;
        statusText.classList.add('error');
    }
}

function flattenTree(nodes, level = 0, parentId = null) {
    const result = [];

    nodes.forEach(node => {
        const hasChildren = Array.isArray(node.subordinates) && node.subordinates.length > 0;

        result.push({
            id: node.id,
            name: node.name,
            position: node.position,
            department: node.department,
            level,
            parentId,
            hasChildren
        });

        if (hasChildren) {
            result.push(...flattenTree(node.subordinates, level + 1, node.id));
        }
    });

    return result;
}

function isVisible(row) {
    let currentParentId = row.parentId;

    while (currentParentId !== null) {
        if (collapsedIds.has(currentParentId)) {
            return false;
        }
        const parent = flatRows.find(item => item.id === currentParentId);
        currentParentId = parent ? parent.parentId : null;
    }

    return true;
}

function normalizeText(value) {
    return String(value ?? '').trim().toLowerCase();
}

function getNameFilter() {
    return normalizeText(nameFilterInput.value);
}

function getDepartmentFilter() {
    return departmentFilterSelect.value;
}

function getPositionFilter() {
    return positionFilterSelect.value;
}

function hasActiveFilters(filters) {
    return Boolean(filters.name || filters.department || filters.position);
}

function isFilterMatch(row, filters) {
    const nameMatches = !filters.name || normalizeText(row.name).includes(filters.name);
    const departmentMatches = !filters.department || row.department === filters.department;
    const positionMatches = !filters.position || row.position === filters.position;

    return nameMatches && departmentMatches && positionMatches;
}

function hasMatchingChild(row, filters) {
    return flatRows.some(item => item.parentId === row.id
        && (isFilterMatch(item, filters) || hasMatchingChild(item, filters)));
}

function fillSelectFilter(selectElement, values, defaultLabel) {
    const currentValue = selectElement.value;
    const uniqueValues = [...new Set(values.filter(Boolean))].sort((first, second) => first.localeCompare(second, 'ru'));

    selectElement.replaceChildren(new Option(defaultLabel, ''));
    uniqueValues.forEach(value => {
        selectElement.add(new Option(value, value));
    });

    if (uniqueValues.includes(currentValue)) {
        selectElement.value = currentValue;
    }
}

function renderCurrentTable() {
    const filters = {
        name: getNameFilter(),
        department: getDepartmentFilter(),
        position: getPositionFilter()
    };
    const visibleRows = hasActiveFilters(filters)
        ? flatRows.filter(row => isFilterMatch(row, filters) || hasMatchingChild(row, filters))
        : flatRows.filter(isVisible);

    renderTable({
        tableBody,
        visibleRows,
        collapsedIds,
        onToggle: toggleRow
    });
}

function toggleRow(id) {
    if (collapsedIds.has(id)) {
        collapsedIds.delete(id);
    } else {
        collapsedIds.add(id);
    }

    renderCurrentTable();
}

export function expandAll() {
    collapsedIds.clear();
    renderCurrentTable();
}

export function collapseAll() {
    collapsedIds = new Set(
        flatRows.filter(row => row.hasChildren).map(row => row.id)
    );
    renderCurrentTable();
}

document.getElementById('reloadBtn').addEventListener('click', loadEmployees);
nameFilterInput.addEventListener('input', renderCurrentTable);
departmentFilterSelect.addEventListener('change', renderCurrentTable);
positionFilterSelect.addEventListener('change', renderCurrentTable);

loadEmployees();
