import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../utils/constants.js';

/**
 * QueryResults - Displays query results in a table format
 */
class QueryResults extends BaseComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.data = [];
        this.columns = [];
    }

    init() {
        super.init();

        // Listen for query execution
        eventBus.on(EVENTS.QUERY_EXECUTED, (payload) => {
            this.updateResults(payload.data, payload.columns);
        });

        // Load initial data from state
        const data = stateManager.getData();
        const columns = stateManager.getColumns();
        if (data && data.length > 0) {
            this.updateResults(data, columns);
        }
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-query-results' });

        // Header
        const header = this.createElement('div', { className: 'gb-query-results-header' });
        const title = this.createElement('span', { className: 'gb-query-results-title' }, 'Results');
        this.rowCount = this.createElement('span', { className: 'gb-query-results-count' });
        header.appendChild(title);
        header.appendChild(this.rowCount);

        // Table container
        this.tableContainer = this.createElement('div', { className: 'gb-query-results-table' });

        // Empty state
        this.emptyState = this.createElement('div', { className: 'gb-query-results-empty' });
        this.emptyState.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
            </svg>
            <p>Execute a query to see results</p>
        `;

        this.tableContainer.appendChild(this.emptyState);

        this.element.appendChild(header);
        this.element.appendChild(this.tableContainer);

        this.container.appendChild(this.element);
    }

    updateResults(data, columns) {
        this.data = data || [];
        this.columns = columns || [];

        // Update row count
        this.rowCount.textContent = `(${this.data.length} rows)`;

        // Clear table container
        this.tableContainer.innerHTML = '';

        if (this.data.length === 0) {
            this.tableContainer.appendChild(this.emptyState);
            return;
        }

        // Build table
        const table = this.createElement('table');

        // Header row
        const thead = this.createElement('thead');
        const headerRow = this.createElement('tr');
        this.columns.forEach(col => {
            const th = this.createElement('th', {}, col);
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body rows (limit to 100 for performance)
        const tbody = this.createElement('tbody');
        const displayData = this.data.slice(0, 100);

        displayData.forEach(row => {
            const tr = this.createElement('tr');
            this.columns.forEach(col => {
                const td = this.createElement('td');
                const value = row[col];
                if (value === null) {
                    td.innerHTML = '<em class="gb-null">NULL</em>';
                } else if (value === '') {
                    td.innerHTML = '<em class="gb-empty">(empty)</em>';
                } else {
                    td.textContent = String(value);
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        this.tableContainer.appendChild(table);

        // Show truncation notice
        if (this.data.length > 100) {
            const notice = this.createElement('div', { className: 'gb-query-results-notice' });
            notice.textContent = `Showing 100 of ${this.data.length} rows`;
            this.tableContainer.appendChild(notice);
        }
    }

    destroy() {
        eventBus.off(EVENTS.QUERY_EXECUTED);
        super.destroy();
    }
}

export { QueryResults };
