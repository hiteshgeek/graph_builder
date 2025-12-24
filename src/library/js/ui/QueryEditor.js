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

        const formatBtn = this.createElement('button', {
            className: 'gb-query-format-btn',
            type: 'button',
            title: 'Format SQL query'
        }, 'Format');

        const clearBtn = this.createElement('button', {
            className: 'gb-query-clear-btn',
            type: 'button',
            title: 'Clear query and reset to demo data'
        }, 'Clear');

        const executeBtn = this.createElement('button', {
            className: 'gb-query-execute-btn',
            type: 'button'
        }, 'Execute');

        this.bindEvent(formatBtn, 'click', this.onFormat.bind(this));
        this.bindEvent(clearBtn, 'click', this.onClear.bind(this));
        this.bindEvent(executeBtn, 'click', this.onExecute.bind(this));

        buttonsContainer.appendChild(formatBtn);
        buttonsContainer.appendChild(clearBtn);
        buttonsContainer.appendChild(executeBtn);

        header.appendChild(title);
        header.appendChild(hint);
        header.appendChild(buttonsContainer);

        // Syntax-highlighted SQL editor with overlay
        const editorContainer = this.createElement('div', { className: 'gb-query-editor-container' });

        // Highlighted code backdrop
        const highlight = this.createElement('pre', { className: 'gb-query-highlight' });
        const highlightCode = this.createElement('code', { className: 'gb-query-highlight-code' });
        highlight.appendChild(highlightCode);

        const textarea = this.createElement('textarea', {
            className: 'gb-query-input',
            placeholder: 'SELECT column1, column2\nFROM table_name\nWHERE condition = value\nLIMIT 100',
            spellcheck: 'false',
            autocomplete: 'off',
            autocorrect: 'off',
            autocapitalize: 'off'
        });
        textarea.value = stateManager.getQuery() || '';

        // Update highlight on input
        const updateHighlight = () => {
            highlightCode.innerHTML = this.highlightSQL(textarea.value) + '\n';
        };

        // Sync scroll between textarea and highlight
        const syncScroll = () => {
            highlight.scrollTop = textarea.scrollTop;
            highlight.scrollLeft = textarea.scrollLeft;
        };

        this.bindEvent(textarea, 'input', (e) => {
            updateHighlight();
            // Debounce save to state
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                stateManager.setQuery(e.target.value);
            }, 300);
        });

        this.bindEvent(textarea, 'scroll', syncScroll);

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
                updateHighlight();
            }
        });

        // Auto-format on blur (focus lost)
        this.bindEvent(textarea, 'blur', () => {
            const sql = textarea.value.trim();
            if (sql) {
                const formatted = this.formatSQL(sql);
                textarea.value = formatted;
                stateManager.setQuery(formatted);
                updateHighlight();
            }
        });

        this.textarea = textarea;
        this.highlightCode = highlightCode;
        this.executeBtn = executeBtn;
        this.updateHighlight = updateHighlight;

        editorContainer.appendChild(highlight);
        editorContainer.appendChild(textarea);

        // Initial highlight
        updateHighlight();

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
     * Format the SQL query
     */
    onFormat() {
        const sql = this.textarea.value.trim();
        if (!sql) return;

        const formatted = this.formatSQL(sql);
        this.textarea.value = formatted;
        stateManager.setQuery(formatted);
    }

    /**
     * PhpMyAdmin-style SQL formatter
     * Major clause keywords on their own line, content indented below
     */
    formatSQL(sql) {
        // Normalize whitespace to single spaces
        let formatted = sql.replace(/\s+/g, ' ').trim();

        // Multi-word keywords need protection
        const multiWordMap = {
            'LEFT OUTER JOIN': '___LOJ___',
            'RIGHT OUTER JOIN': '___ROJ___',
            'FULL OUTER JOIN': '___FOJ___',
            'LEFT JOIN': '___LJ___',
            'RIGHT JOIN': '___RJ___',
            'INNER JOIN': '___IJ___',
            'OUTER JOIN': '___OJ___',
            'CROSS JOIN': '___CJ___',
            'ORDER BY': '___OB___',
            'GROUP BY': '___GB___',
            'UNION ALL': '___UA___',
            'INSERT INTO': '___II___',
            'DELETE FROM': '___DF___'
        };

        // Replace multi-word keywords with placeholders (case-insensitive)
        for (const [kw, ph] of Object.entries(multiWordMap)) {
            const regex = new RegExp(kw.replace(/\s+/g, '\\s+'), 'gi');
            formatted = formatted.replace(regex, ph);
        }

        // Block keywords - these get their own line, content on next line indented
        const blockKeywords = ['SELECT', 'FROM', 'WHERE', '___OB___', '___GB___', 'HAVING', 'LIMIT', 'SET', 'VALUES'];

        // Process block keywords
        blockKeywords.forEach(kw => {
            const regex = new RegExp(`\\b${kw}\\b\\s*`, 'gi');
            formatted = formatted.replace(regex, `\n${kw}\n    `);
        });

        // JOIN keywords - new line for JOIN, then table alias, then ON with content indented
        const joinKeywords = ['___LOJ___', '___ROJ___', '___FOJ___', '___LJ___', '___RJ___', '___IJ___', '___OJ___', '___CJ___', 'JOIN'];

        joinKeywords.forEach(kw => {
            const regex = new RegExp(`\\b${kw}\\b`, 'gi');
            formatted = formatted.replace(regex, `\n${kw}`);
        });

        // Format: JOIN table alias ON\n    (condition)
        formatted = formatted.replace(/\n(___[A-Z]+___|JOIN)\s+(\S+(?:\s+\S+)?)\s+ON\s*/gi, '\n$1 $2 ON\n    ');

        // Restore multi-word keywords
        for (const [kw, ph] of Object.entries(multiWordMap)) {
            formatted = formatted.split(ph).join(kw.toUpperCase());
        }

        // Clean up multiple newlines and leading newline
        formatted = formatted.replace(/^\n+/, '');
        formatted = formatted.replace(/\n{2,}/g, '\n');

        // Process lines - trim and uppercase keywords
        const lines = formatted.split('\n');
        const result = lines.map(line => {
            let trimmed = line.trimEnd();
            if (!trimmed.trim()) return null;

            // Preserve indentation (4 spaces) but trim otherwise
            if (trimmed.startsWith('    ')) {
                trimmed = '    ' + trimmed.substring(4).trim();
            } else {
                trimmed = trimmed.trim();
            }

            // Uppercase SQL keywords
            const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING',
                'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
                'CROSS JOIN', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'ON',
                'SET', 'VALUES', 'INSERT INTO', 'UPDATE', 'DELETE FROM', 'UNION ALL', 'UNION',
                'AS', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'NOT', 'ASC', 'DESC', 'DISTINCT',
                'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DATE', 'NOW', 'CONCAT', 'SUBSTRING', 'TRIM',
                'UPPER', 'LOWER', 'COALESCE', 'IFNULL', 'IF', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
                'MONTHNAME', 'DAYNAME', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND',
                'DATE_FORMAT', 'STR_TO_DATE', 'CURDATE', 'CURTIME', 'DATEDIFF', 'TIMEDIFF',
                'DATE_ADD', 'DATE_SUB', 'LAST_DAY', 'WEEK', 'WEEKDAY', 'QUARTER',
                'ROUND', 'FLOOR', 'CEIL', 'ABS', 'MOD', 'RAND', 'LENGTH', 'CHAR_LENGTH',
                'LEFT', 'RIGHT', 'REPLACE', 'REVERSE', 'LPAD', 'RPAD', 'CAST', 'CONVERT',
                'GROUP_CONCAT', 'JSON_EXTRACT', 'JSON_OBJECT', 'JSON_ARRAY'];

            keywords.forEach(kw => {
                const regex = new RegExp(`\\b${kw}\\b`, 'gi');
                trimmed = trimmed.replace(regex, kw.toUpperCase());
            });

            return trimmed;
        }).filter(line => line !== null);

        return result.join('\n');
    }

    /**
     * Syntax highlight SQL for display
     * Returns HTML with span-wrapped tokens
     */
    highlightSQL(sql) {
        if (!sql) return '';

        // Escape HTML
        let highlighted = sql
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Protect strings first (single and double quoted)
        const strings = [];
        highlighted = highlighted.replace(/'[^']*'|"[^"]*"/g, (match) => {
            const placeholder = `___STR${strings.length}___`;
            strings.push(`<span class="gb-sql-string">${match}</span>`);
            return placeholder;
        });

        // Protect numbers
        highlighted = highlighted.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="gb-sql-number">$1</span>');

        // Keywords (major clauses)
        const majorKeywords = ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET',
            'INSERT INTO', 'UPDATE', 'DELETE FROM', 'SET', 'VALUES', 'UNION ALL', 'UNION'];

        majorKeywords.forEach(kw => {
            const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
            highlighted = highlighted.replace(regex, '<span class="gb-sql-keyword">$1</span>');
        });

        // JOIN keywords
        const joinKeywords = ['JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'CROSS JOIN',
            'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'ON'];

        joinKeywords.forEach(kw => {
            const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
            highlighted = highlighted.replace(regex, '<span class="gb-sql-keyword">$1</span>');
        });

        // Operators and conditions
        const operators = ['AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'AS', 'ASC', 'DESC', 'DISTINCT'];

        operators.forEach(kw => {
            const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
            highlighted = highlighted.replace(regex, '<span class="gb-sql-operator">$1</span>');
        });

        // Functions
        const functions = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DATE', 'NOW', 'CONCAT', 'SUBSTRING', 'TRIM',
            'UPPER', 'LOWER', 'COALESCE', 'IFNULL', 'IF', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
            'MONTHNAME', 'DAYNAME', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND',
            'DATE_FORMAT', 'STR_TO_DATE', 'CURDATE', 'CURTIME', 'DATEDIFF', 'TIMEDIFF',
            'DATE_ADD', 'DATE_SUB', 'LAST_DAY', 'WEEK', 'WEEKDAY', 'QUARTER',
            'ROUND', 'FLOOR', 'CEIL', 'ABS', 'MOD', 'RAND', 'LENGTH', 'CHAR_LENGTH',
            'LEFT', 'RIGHT', 'REPLACE', 'REVERSE', 'LPAD', 'RPAD', 'CAST', 'CONVERT',
            'GROUP_CONCAT', 'JSON_EXTRACT', 'JSON_OBJECT', 'JSON_ARRAY'];

        functions.forEach(fn => {
            const regex = new RegExp(`\\b(${fn})\\s*(?=\\()`, 'gi');
            highlighted = highlighted.replace(regex, '<span class="gb-sql-function">$1</span>');
        });

        // Restore strings
        strings.forEach((str, i) => {
            highlighted = highlighted.replace(`___STR${i}___`, str);
        });

        return highlighted;
    }

    /**
     * Clear query and reset to demo data
     */
    onClear() {
        // Clear textarea
        this.textarea.value = '';

        // Clear state
        stateManager.setQuery('');
        stateManager.clearData();

        // Update highlight
        if (this.updateHighlight) this.updateHighlight();

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
        if (this.updateHighlight) this.updateHighlight();
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
        if (this.updateHighlight) this.updateHighlight();
    }
}

export { QueryEditor };
