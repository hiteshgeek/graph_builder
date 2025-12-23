import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { EVENTS } from '../utils/constants.js';
import { ApiClient } from '../data/ApiClient.js';
import { QueryValidator } from '../data/QueryValidator.js';
import { debounce } from '../utils/helpers.js';

/**
 * QueryEditor - SQL query input with execution
 * Simple textarea approach without overlay highlighting to avoid sync issues
 */
class QueryEditor extends BaseComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.apiClient = new ApiClient(options.apiBase || '');
        this.isLoading = false;
        this.saveTimeout = null;
    }

    init() {
        super.init();
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-query-editor' });

        // Header
        const header = this.createElement('div', { className: 'gb-query-header' });
        const title = this.createElement('span', { className: 'gb-query-title' }, 'SQL Query');
        const hint = this.createElement('span', { className: 'gb-query-hint' }, 'Ctrl+Enter to execute');

        // Buttons container
        const buttonsContainer = this.createElement('div', { className: 'gb-query-buttons' });

        const clearBtn = this.createElement('button', {
            className: 'gb-query-clear-btn',
            type: 'button',
            title: 'Clear query and reset to demo data'
        }, 'Clear');

        const executeBtn = this.createElement('button', {
            className: 'gb-query-execute-btn',
            type: 'button'
        }, 'Execute');

        this.bindEvent(clearBtn, 'click', this.onClear.bind(this));
        this.bindEvent(executeBtn, 'click', this.onExecute);

        buttonsContainer.appendChild(clearBtn);
        buttonsContainer.appendChild(executeBtn);

        header.appendChild(title);
        header.appendChild(hint);
        header.appendChild(buttonsContainer);

        // Simple textarea editor (no overlay highlighting)
        const editorContainer = this.createElement('div', { className: 'gb-query-editor-container' });

        const textarea = this.createElement('textarea', {
            className: 'gb-query-input',
            placeholder: 'SELECT column1, column2\nFROM table_name\nWHERE condition = value\nLIMIT 100',
            spellcheck: 'false',
            autocomplete: 'off',
            autocorrect: 'off',
            autocapitalize: 'off'
        });
        textarea.value = stateManager.getQuery() || '';

        this.bindEvent(textarea, 'input', (e) => {
            // Debounce save to state
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                stateManager.setQuery(e.target.value);
            }, 300);
        });

        this.bindEvent(textarea, 'keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.onExecute();
            }
            // Handle Tab key for indentation
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 2;
            }
        });

        this.textarea = textarea;
        this.executeBtn = executeBtn;

        editorContainer.appendChild(textarea);

        // Status/error area
        this.statusArea = this.createElement('div', { className: 'gb-query-status' });

        this.element.appendChild(header);
        this.element.appendChild(editorContainer);
        this.element.appendChild(this.statusArea);

        this.container.appendChild(this.element);
    }

    async onExecute() {
        if (this.isLoading) return;

        const sql = this.textarea.value.trim();

        // Client-side validation
        const validation = QueryValidator.validate(sql);
        if (!validation.valid) {
            this.showError(validation.errors.join('. '));
            return;
        }

        if (validation.warnings.length > 0) {
            this.showWarning(validation.warnings.join('. '));
        }

        this.setLoading(true);
        this.clearStatus();

        try {
            const result = await this.apiClient.executeQuery(sql);

            stateManager.setData(result.data, result.columns);

            this.showSuccess(`Returned ${result.rowCount} rows`);

            if (result.warnings && result.warnings.length > 0) {
                this.showWarning(result.warnings.join('. '));
            }

        } catch (error) {
            this.showError(error.message);
            this.emit(EVENTS.QUERY_ERROR, { error: error.message });
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.executeBtn.disabled = loading;
        this.executeBtn.textContent = loading ? 'Running...' : 'Execute';
        this.element.classList.toggle('gb-query-editor--loading', loading);
    }

    /**
     * Clear query and reset to demo data
     */
    onClear() {
        // Clear textarea
        this.textarea.value = '';
        this.updateHighlight('');

        // Clear state
        stateManager.setQuery('');
        stateManager.clearData();

        // Clear status
        this.clearStatus();
        this.showSuccess('Cleared. Using demo data.');
    }

    showError(message) {
        this.statusArea.innerHTML = '';
        const error = this.createElement('div', { className: 'gb-query-error' }, message);
        this.statusArea.appendChild(error);
    }

    showWarning(message) {
        const warning = this.createElement('div', { className: 'gb-query-warning' }, message);
        this.statusArea.appendChild(warning);
    }

    showSuccess(message) {
        this.statusArea.innerHTML = '';
        const success = this.createElement('div', { className: 'gb-query-success' }, message);
        this.statusArea.appendChild(success);
    }

    clearStatus() {
        this.statusArea.innerHTML = '';
    }

    setQuery(sql) {
        this.textarea.value = sql;
        stateManager.setQuery(sql);
    }

    getQuery() {
        return this.textarea.value;
    }

    execute() {
        this.onExecute();
    }

    /**
     * Insert text at cursor position
     * @param {string} text
     */
    insertText(text) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const value = this.textarea.value;

        // Add space before if needed
        const needsSpaceBefore = start > 0 && !/\s/.test(value[start - 1]);
        const insertText = (needsSpaceBefore ? ' ' : '') + text;

        this.textarea.value = value.substring(0, start) + insertText + value.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + insertText.length;
        this.textarea.focus();
        stateManager.setQuery(this.textarea.value);
    }
}

export { QueryEditor };
