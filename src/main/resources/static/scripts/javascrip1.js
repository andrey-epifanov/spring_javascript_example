const API_URL = '/api/employees/tree';
const tableBody = document.getElementById('employeeTableBody');
const statusText = document.getElementById('statusText');

let flatRows = [];
let collapsedIds = new Set();

async function loadEmployees() {
    statusText.textContent = 'Загрузка...';
    statusText.classList.remove('error');

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }

        const data = await response.json();
        flatRows = flattenTree(data);
        collapsedIds = new Set(
            flatRows.filter(row => row.hasChildren).map(row => row.id)
        );
        renderTable();
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

function renderTable() {
    const visibleRows = flatRows.filter(isVisible);

    if (visibleRows.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">Нет данных</td></tr>';
        return;
    }

    tableBody.innerHTML = visibleRows.map(row => {
        const indent = row.level * 24;
        const toggleButton = row.hasChildren
            ? `<button type="button" class="toggle-btn" data-id="${row.id}" aria-label="toggle">
                    ${collapsedIds.has(row.id) ? '▸' : '▾'}
               </button>`
            : '<span class="toggle-placeholder"></span>';

        return `
            <tr data-id="${row.id}">
                <td>
                    <div class="name-cell" style="padding-left: ${indent}px">
                        ${toggleButton}
                        <span>${escapeHtml(row.name)}</span>
                    </div>
                </td>
                <td>${escapeHtml(row.position)}</td>
                <td>${escapeHtml(row.department)}</td>
                <td><span class="level-badge">${row.level}</span></td>
            </tr>
        `;
    }).join('');

    tableBody.querySelectorAll('.toggle-btn').forEach(button => {
        button.addEventListener('click', () => {
            const id = Number(button.dataset.id);

            if (collapsedIds.has(id)) {
                collapsedIds.delete(id);
            } else {
                collapsedIds.add(id);
            }

            renderTable();
        });
    });
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function expandAll() {
    collapsedIds.clear();
    renderTable();
}

function collapseAll() {
    collapsedIds = new Set(
        flatRows.filter(row => row.hasChildren).map(row => row.id)
    );
    renderTable();
}

document.getElementById('expandAllBtn').addEventListener('click', expandAll);
document.getElementById('collapseAllBtn').addEventListener('click', collapseAll);
document.getElementById('reloadBtn').addEventListener('click', loadEmployees);

loadEmployees();
