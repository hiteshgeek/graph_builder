import { BaseComponent } from '../core/BaseComponent.js';
import { ApiClient } from '../data/ApiClient.js';
import { debounce } from '../utils/helpers.js';

/**
 * DataExplorer - Database browser with table search dropdown and field display
 */
class DataExplorer extends BaseComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.apiClient = new ApiClient(options.apiBase || '');
        this.database = null;
        this.selectedTable = null;
        this.tables = [];
        this.fields = [];
        this.isLoadingTables = false;
        this.isLoadingFields = false;
        this.onFieldClick = options.onFieldClick || null;
        this.onTableSelect = options.onTableSelect || null;
        this.queryEditor = null;
        this.dropdownVisible = false;
    }

    init() {
        super.init();
        this.loadTables();
    }

    setQueryEditor(queryEditor) {
        this.queryEditor = queryEditor;
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-data-explorer' });

        // Database info section
        this.dbInfoSection = this.createElement('div', { className: 'gb-db-info' });
        this.dbNameEl = this.createElement('div', { className: 'gb-db-name' });
        this.dbNameEl.innerHTML = `<span class="gb-db-icon">${this.getDbIcon()}</span><span class="gb-db-label">Loading...</span>`;
        this.dbInfoSection.appendChild(this.dbNameEl);

        // Table search section with dropdown
        this.searchSection = this.createElement('div', { className: 'gb-table-search' });
        const searchLabel = this.createElement('label', { className: 'gb-search-label' }, 'Select Table');

        // Search container for input + dropdown
        const searchContainer = this.createElement('div', { className: 'gb-search-container' });

        this.searchInput = this.createElement('input', {
            type: 'text',
            className: 'gb-search-input',
            placeholder: 'Search and select a table...'
        });

        // Dropdown for search results
        this.dropdown = this.createElement('div', { className: 'gb-table-dropdown' });
        this.dropdown.style.display = 'none';

        const debouncedSearch = debounce((value) => this.loadTables(value), 300);

        this.bindEvent(this.searchInput, 'input', (e) => {
            debouncedSearch(e.target.value);
            this.showDropdown();
        });

        this.bindEvent(this.searchInput, 'focus', () => {
            if (this.tables.length > 0) {
                this.showDropdown();
            }
        });

        // Close dropdown when clicking outside
        this.bindEvent(document, 'click', (e) => {
            if (!this.searchSection.contains(e.target)) {
                this.hideDropdown();
            }
        });

        searchContainer.appendChild(this.searchInput);
        searchContainer.appendChild(this.dropdown);

        this.searchSection.appendChild(searchLabel);
        this.searchSection.appendChild(searchContainer);

        // Fields section (shown when table is selected)
        this.fieldsSection = this.createElement('div', { className: 'gb-fields-section' });
        this.fieldsHeader = this.createElement('div', { className: 'gb-fields-header' });
        this.fieldsList = this.createElement('div', { className: 'gb-fields-list' });
        this.fieldsSection.appendChild(this.fieldsHeader);
        this.fieldsSection.appendChild(this.fieldsList);
        this.fieldsSection.style.display = 'none';

        this.element.appendChild(this.dbInfoSection);
        this.element.appendChild(this.searchSection);
        this.element.appendChild(this.fieldsSection);

        this.container.appendChild(this.element);
    }

    showDropdown() {
        this.dropdown.style.display = 'block';
        this.dropdownVisible = true;
    }

    hideDropdown() {
        this.dropdown.style.display = 'none';
        this.dropdownVisible = false;
    }

    async loadTables(search = '') {
        if (this.isLoadingTables) return;

        this.isLoadingTables = true;
        this.dropdown.innerHTML = '<div class="gb-loading">Loading tables...</div>';
        this.showDropdown();

        try {
            const response = await this.apiClient.getTables(search);

            if (response.success) {
                const data = response.data || {};
                this.database = data.database;
                this.tables = data.tables || [];
                this.updateDbInfo();
                this.renderDropdown();
            } else {
                const errorMsg = response.screen_message?.[0]?.message || 'Error loading tables';
                this.dropdown.innerHTML = `<div class="gb-error">${errorMsg}</div>`;
            }
        } catch (error) {
            this.dropdown.innerHTML = `<div class="gb-error">${error.message}</div>`;
        } finally {
            this.isLoadingTables = false;
        }
    }

    updateDbInfo() {
        if (this.database) {
            this.dbNameEl.innerHTML = `<span class="gb-db-icon">${this.getDbIcon()}</span><span class="gb-db-label">${this.database}</span>`;
        }
    }

    renderDropdown() {
        this.dropdown.innerHTML = '';

        if (this.tables.length === 0) {
            this.dropdown.innerHTML = '<div class="gb-no-results">No tables found</div>';
            return;
        }

        this.tables.forEach(table => {
            const tableEl = this.createElement('div', {
                className: 'gb-dropdown-item',
                dataset: { table: table.name }
            });

            const icon = this.createElement('span', { className: 'gb-table-icon' });
            icon.innerHTML = this.getTableIcon();

            const name = this.createElement('span', { className: 'gb-table-name' }, table.name);

            const rows = this.createElement('span', { className: 'gb-table-rows' },
                table.row_count !== null ? `${this.formatNumber(table.row_count)} rows` : '');

            tableEl.appendChild(icon);
            tableEl.appendChild(name);
            tableEl.appendChild(rows);

            this.bindEvent(tableEl, 'click', () => this.selectTable(table.name));

            this.dropdown.appendChild(tableEl);
        });
    }

    async selectTable(tableName) {
        this.selectedTable = tableName;
        this.searchInput.value = tableName;
        this.hideDropdown();

        // Load fields
        await this.loadFields(tableName);

        // Generate and set the query
        this.generateQuery(tableName);

        if (this.onTableSelect) {
            this.onTableSelect(tableName, this.fields);
        }
    }

    generateQuery(tableName) {
        const query = `SELECT * FROM ${tableName} LIMIT 10`;

        if (this.queryEditor) {
            this.queryEditor.setQuery(query);
        }
    }

    async loadFields(tableName) {
        if (this.isLoadingFields) return;

        this.isLoadingFields = true;
        this.fieldsSection.style.display = 'block';
        this.fieldsHeader.innerHTML = `<span class="gb-fields-title">${tableName}</span>`;
        this.fieldsList.innerHTML = '<div class="gb-loading">Loading fields...</div>';

        try {
            const response = await this.apiClient.getFields(tableName);

            if (response.success) {
                const data = response.data || {};
                this.fields = data.fields || [];
                this.renderFields();
            } else {
                const errorMsg = response.screen_message?.[0]?.message || 'Error loading fields';
                this.fieldsList.innerHTML = `<div class="gb-error">${errorMsg}</div>`;
            }
        } catch (error) {
            this.fieldsList.innerHTML = `<div class="gb-error">${error.message}</div>`;
        } finally {
            this.isLoadingFields = false;
        }
    }

    renderFields() {
        this.fieldsList.innerHTML = '';

        if (this.fields.length === 0) {
            this.fieldsList.innerHTML = '<div class="gb-no-results">No fields found</div>';
            return;
        }

        this.fields.forEach(field => {
            const fieldEl = this.createElement('div', {
                className: 'gb-field-item',
                dataset: { field: field.name },
                title: `${field.fullType}${field.comment ? ' - ' + field.comment : ''}`
            });

            const icon = this.createElement('span', { className: `gb-field-icon gb-field-icon--${field.category}` });
            icon.innerHTML = this.getFieldIcon(field);

            const name = this.createElement('span', { className: 'gb-field-name' }, field.name);

            const type = this.createElement('span', { className: 'gb-field-type' }, field.type);

            const badges = this.createElement('span', { className: 'gb-field-badges' });
            if (field.isPrimary) {
                badges.innerHTML += '<span class="gb-badge gb-badge--primary">PK</span>';
            }
            if (field.isUnique) {
                badges.innerHTML += '<span class="gb-badge gb-badge--unique">UQ</span>';
            }
            if (field.isIndex) {
                badges.innerHTML += '<span class="gb-badge gb-badge--index">IX</span>';
            }

            fieldEl.appendChild(icon);
            fieldEl.appendChild(name);
            fieldEl.appendChild(type);
            fieldEl.appendChild(badges);

            this.bindEvent(fieldEl, 'click', () => {
                if (this.onFieldClick) {
                    this.onFieldClick(field.name, this.selectedTable);
                }
            });

            this.fieldsList.appendChild(fieldEl);
        });
    }

    formatNumber(num) {
        if (num === null || num === undefined) return '';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    getDbIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>`;
    }

    getTableIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>`;
    }

    getFieldIcon(field) {
        if (field.isPrimary) {
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
            </svg>`;
        }

        switch (field.category) {
            case 'number':
                return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 17l6-6-6-6"></path>
                    <path d="M12 17h8"></path>
                </svg>`;
            case 'date':
                return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>`;
            case 'json':
                return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 18l6-6-6-6"></path>
                    <path d="M8 6l-6 6 6 6"></path>
                </svg>`;
            default:
                return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>`;
        }
    }

    getSelectedTable() {
        return this.selectedTable;
    }

    getFields() {
        return this.fields;
    }

    getDatabase() {
        return this.database;
    }
}

export { DataExplorer };
