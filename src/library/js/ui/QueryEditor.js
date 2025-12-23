import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { EVENTS } from '../utils/constants.js';
import { ApiClient } from '../data/ApiClient.js';
import { QueryValidator } from '../data/QueryValidator.js';
import { debounce } from '../utils/helpers.js';

/**
 * QueryEditor - SQL query input with execution and syntax highlighting support
 */
class QueryEditor extends BaseComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.apiClient = new ApiClient(options.apiBase || '');
        this.isLoading = false;
        this.codeElement = null;
        this.preElement = null;
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
        const executeBtn = this.createElement('button', {
            className: 'gb-query-execute-btn',
            type: 'button'
        }, 'Execute');

        this.bindEvent(executeBtn, 'click', this.onExecute);

        header.appendChild(title);
        header.appendChild(hint);
        header.appendChild(executeBtn);

        // Editor container with overlay for highlighting
        const editorContainer = this.createElement('div', { className: 'gb-query-editor-container' });

        // Highlighted code layer (background)
        this.preElement = this.createElement('pre', { className: 'gb-query-highlight' });
        this.codeElement = this.createElement('code', { className: 'language-sql' });
        this.preElement.appendChild(this.codeElement);

        // Textarea layer (foreground, transparent text)
        const textarea = this.createElement('textarea', {
            className: 'gb-query-input',
            placeholder: 'SELECT column1, column2\nFROM table_name\nWHERE condition = value\nLIMIT 100',
            spellcheck: 'false',
            autocomplete: 'off',
            autocorrect: 'off',
            autocapitalize: 'off'
        });
        textarea.value = stateManager.getQuery() || '';

        // Sync scroll between textarea and pre
        this.bindEvent(textarea, 'scroll', () => {
            this.preElement.scrollTop = textarea.scrollTop;
            this.preElement.scrollLeft = textarea.scrollLeft;
        });

        this.bindEvent(textarea, 'input', (e) => {
            this.updateHighlight(e.target.value);
            debounce(() => stateManager.setQuery(e.target.value), 300)();
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
                this.updateHighlight(textarea.value);
            }
        });

        this.textarea = textarea;
        this.executeBtn = executeBtn;

        editorContainer.appendChild(this.preElement);
        editorContainer.appendChild(textarea);

        // Status/error area
        this.statusArea = this.createElement('div', { className: 'gb-query-status' });

        this.element.appendChild(header);
        this.element.appendChild(editorContainer);
        this.element.appendChild(this.statusArea);

        this.container.appendChild(this.element);

        // Initial highlight
        this.updateHighlight(textarea.value);
    }

    updateHighlight(code) {
        if (!this.codeElement) return;

        // Add newline to prevent layout issues
        const displayCode = code + '\n';

        // Check if highlight.js is available
        if (window.hljs) {
            this.codeElement.textContent = displayCode;
            this.codeElement.className = 'language-sql';
            window.hljs.highlightElement(this.codeElement);
        } else {
            // Fallback: just display plain text
            this.codeElement.textContent = displayCode;
        }
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
        this.updateHighlight(sql);
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
        this.updateHighlight(this.textarea.value);
        stateManager.setQuery(this.textarea.value);
    }
}

export { QueryEditor };
