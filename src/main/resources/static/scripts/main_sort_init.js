// Функция для выполнения сортировки на уровне row сортировки (4 режима)
import { enableColumnSortingLevel2 } from './sort_utils.js';

function initializeSortingLevel2() {
    enableColumnSortingLevel2();
    console.log('initializeSortingLevel2: sorting initialized (4 modes)');
}

export { initializeSortingLevel2 };
