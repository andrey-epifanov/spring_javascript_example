import { escapeHtml } from './html-utils.js';

export function renderTable({tableBody, visibleRows, collapsedIds, onToggle}) {
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
            onToggle(Number(button.dataset.id));
        });
    });
}
