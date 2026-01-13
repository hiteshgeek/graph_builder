import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { ApiClient } from '../data/ApiClient.js';
import { QueryValidator } from '../data/QueryValidator.js';

/**
 * DataSourceEditor - SQL Query Editor for data sources
 */
class DataSourceEditor extends BaseComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.apiClient = new ApiClient(options.apiBase || '');
        this.activeSourceType = 'sql';
        this.isLoading = false;
        this.saveTimeout = null;
    }

    init() {
        super.init();
        this.restoreState();
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-datasource-editor' });

        // Content panels
        this.panelsContainer = this.createElement('div', { className: 'gb-datasource-panels' });

        // SQL Panel
        this.sqlPanel = this.createSqlPanel();
        this.panelsContainer.appendChild(this.sqlPanel);

        // Status area
        this.statusArea = this.createElement('div', { className: 'gb-datasource-status' });

        this.element.appendChild(this.panelsContainer);
        this.element.appendChild(this.statusArea);

        this.container.appendChild(this.element);

        // Set SQL panel as active
        this.sqlPanel.classList.add('gb-datasource-panel--active');
    }

    createSqlPanel() {
        const panel = this.createElement('div', {
            className: 'gb-datasource-panel',
            'data-panel': 'sql'
        });

        // Header
        const header = this.createElement('div', { className: 'gb-datasource-panel-header' });
        const hint = this.createElement('span', { className: 'gb-datasource-hint' }, 'Ctrl+Enter to execute');

        const buttonsContainer = this.createElement('div', { className: 'gb-datasource-buttons' });

        const formatBtn = this.createElement('button', {
            className: 'gb-datasource-btn gb-datasource-btn--secondary',
            type: 'button'
        }, 'Format');

        const clearBtn = this.createElement('button', {
            className: 'gb-datasource-btn gb-datasource-btn--secondary',
            type: 'button'
        }, 'Clear');

        this.sqlExecuteBtn = this.createElement('button', {
            className: 'gb-datasource-btn gb-datasource-btn--primary',
            type: 'button'
        }, 'Execute');

        this.bindEvent(formatBtn, 'click', () => this.formatSql());
        this.bindEvent(clearBtn, 'click', () => this.clearSql());
        this.bindEvent(this.sqlExecuteBtn, 'click', () => this.executeSql());

        buttonsContainer.appendChild(formatBtn);
        buttonsContainer.appendChild(clearBtn);
        buttonsContainer.appendChild(this.sqlExecuteBtn);

        header.appendChild(hint);
        header.appendChild(buttonsContainer);

        // Editor with syntax highlighting overlay
        const editorContainer = this.createElement('div', { className: 'gb-query-editor-container' });

        // Highlighted code backdrop
        const highlight = this.createElement('pre', { className: 'gb-query-highlight' });
        const highlightCode = this.createElement('code', { className: 'gb-query-highlight-code' });
        highlight.appendChild(highlightCode);
        this.sqlHighlightCode = highlightCode;
        this.sqlHighlight = highlight;

        this.sqlTextarea = this.createElement('textarea', {
            className: 'gb-query-input',
            placeholder: 'SELECT column1, column2\nFROM table_name\nWHERE condition = value\nLIMIT 100',
            spellcheck: 'false',
            autocomplete: 'off',
            autocorrect: 'off',
            autocapitalize: 'off'
        });

        // Update highlight on input
        const updateHighlight = () => {
            this.sqlHighlightCode.innerHTML = this.highlightSQL(this.sqlTextarea.value) + '\n';
        };
        this.updateSqlHighlight = updateHighlight;

        // Sync scroll between textarea and highlight
        const syncScroll = () => {
            highlight.scrollTop = this.sqlTextarea.scrollTop;
            highlight.scrollLeft = this.sqlTextarea.scrollLeft;
        };

        this.bindEvent(this.sqlTextarea, 'input', () => {
            updateHighlight();
            this.onSqlInput();
        });
        this.bindEvent(this.sqlTextarea, 'scroll', syncScroll);
        this.bindEvent(this.sqlTextarea, 'keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.executeSql();
            }
            // Handle Tab key for indentation
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.sqlTextarea.selectionStart;
                const end = this.sqlTextarea.selectionEnd;
                this.sqlTextarea.value = this.sqlTextarea.value.substring(0, start) + '  ' + this.sqlTextarea.value.substring(end);
                this.sqlTextarea.selectionStart = this.sqlTextarea.selectionEnd = start + 2;
                updateHighlight();
            }
        });

        editorContainer.appendChild(highlight);
        editorContainer.appendChild(this.sqlTextarea);

        // Initial highlight
        updateHighlight();

        panel.appendChild(header);
        panel.appendChild(editorContainer);

        return panel;
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
        highlighted = highlighted.replace(/'[^']*'|"[^"]*"/g, function(match) {
            const placeholder = '___STR' + strings.length + '___';
            strings.push('<span class="gb-sql-string">' + match + '</span>');
            return placeholder;
        });

        // Protect numbers
        highlighted = highlighted.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="gb-sql-number">$1</span>');

        // Keywords (major clauses)
        const majorKeywords = ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET',
            'INSERT INTO', 'UPDATE', 'DELETE FROM', 'SET', 'VALUES', 'UNION ALL', 'UNION'];

        majorKeywords.forEach(function(kw) {
            const regex = new RegExp('\\b(' + kw + ')\\b', 'gi');
            highlighted = highlighted.replace(regex, '<span class="gb-sql-keyword">$1</span>');
        });

        // JOIN keywords
        const joinKeywords = ['JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'CROSS JOIN',
            'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'ON'];

        joinKeywords.forEach(function(kw) {
            const regex = new RegExp('\\b(' + kw + ')\\b', 'gi');
            highlighted = highlighted.replace(regex, '<span class="gb-sql-keyword">$1</span>');
        });

        // Operators and conditions
        const operators = ['AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'AS', 'ASC', 'DESC', 'DISTINCT'];

        operators.forEach(function(kw) {
            const regex = new RegExp('\\b(' + kw + ')\\b', 'gi');
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

        functions.forEach(function(fn) {
            const regex = new RegExp('\\b(' + fn + ')\\s*(?=\\()', 'gi');
            highlighted = highlighted.replace(regex, '<span class="gb-sql-function">$1</span>');
        });

        // Restore strings
        strings.forEach(function(str, i) {
            highlighted = highlighted.replace('___STR' + i + '___', str);
        });

        return highlighted;
    }

    // SQL Methods
    onSqlInput() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            stateManager.setQuery(this.sqlTextarea.value);
            this.saveDataSourceConfig();
        }, 300);
    }

    formatSql() {
        const sql = this.sqlTextarea.value.trim();
        if (!sql) return;

        const formatted = this.formatSQLQuery(sql);
        this.sqlTextarea.value = formatted;
        stateManager.setQuery(formatted);
        if (this.updateSqlHighlight) this.updateSqlHighlight();
    }

    /**
     * PhpMyAdmin-style SQL formatter
     * Major clause keywords on their own line, content indented below
     */
    formatSQLQuery(sql) {
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
        for (var kw in multiWordMap) {
            if (multiWordMap.hasOwnProperty(kw)) {
                var ph = multiWordMap[kw];
                var regex = new RegExp(kw.replace(/\s+/g, '\\s+'), 'gi');
                formatted = formatted.replace(regex, ph);
            }
        }

        // Block keywords - these get their own line, content on next line indented
        var blockKeywords = ['SELECT', 'FROM', 'WHERE', '___OB___', '___GB___', 'HAVING', 'LIMIT', 'SET', 'VALUES'];

        // Process block keywords
        blockKeywords.forEach(function(kw) {
            var regex = new RegExp('\\b' + kw + '\\b\\s*', 'gi');
            formatted = formatted.replace(regex, '\n' + kw + '\n    ');
        });

        // JOIN keywords - new line for JOIN
        var joinKeywords = ['___LOJ___', '___ROJ___', '___FOJ___', '___LJ___', '___RJ___', '___IJ___', '___OJ___', '___CJ___', 'JOIN'];

        joinKeywords.forEach(function(kw) {
            var regex = new RegExp('\\b' + kw + '\\b', 'gi');
            formatted = formatted.replace(regex, '\n' + kw);
        });

        // Format: JOIN table alias ON\n    (condition)
        formatted = formatted.replace(/\n(___[A-Z]+___|JOIN)\s+(\S+(?:\s+\S+)?)\s+ON\s*/gi, '\n$1 $2 ON\n    ');

        // Restore multi-word keywords
        for (var kw2 in multiWordMap) {
            if (multiWordMap.hasOwnProperty(kw2)) {
                var ph2 = multiWordMap[kw2];
                formatted = formatted.split(ph2).join(kw2.toUpperCase());
            }
        }

        // Clean up multiple newlines and leading newline
        formatted = formatted.replace(/^\n+/, '');
        formatted = formatted.replace(/\n{2,}/g, '\n');

        // Process lines - trim and uppercase keywords
        var lines = formatted.split('\n');
        var allKeywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING',
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

        var result = lines.map(function(line) {
            var trimmed = line.trimEnd();
            if (!trimmed.trim()) return null;

            // Preserve indentation (4 spaces) but trim otherwise
            if (trimmed.startsWith('    ')) {
                trimmed = '    ' + trimmed.substring(4).trim();
            } else {
                trimmed = trimmed.trim();
            }

            // Uppercase SQL keywords
            allKeywords.forEach(function(kw) {
                var regex = new RegExp('\\b' + kw + '\\b', 'gi');
                trimmed = trimmed.replace(regex, kw.toUpperCase());
            });

            return trimmed;
        }).filter(function(line) { return line !== null; });

        return result.join('\n');
    }

    clearSql() {
        this.sqlTextarea.value = '';
        stateManager.setQuery('');
        stateManager.clearData();
        this.clearStatus();
        this.showSuccess('Cleared. Using demo data.');
        if (this.updateSqlHighlight) this.updateSqlHighlight();
    }

    async executeSql() {
        if (this.isLoading) return;

        const sql = this.sqlTextarea.value.trim();
        const validation = QueryValidator.validate(sql);

        if (!validation.valid) {
            this.showError(validation.errors.join('. '));
            return;
        }

        this.setLoading(true);
        this.clearStatus();

        try {
            const result = await this.apiClient.executeQuery(sql);
            stateManager.setData(result.data, result.columns);
            this.showSuccess(`Returned ${result.rowCount} rows`);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    // State Management
    saveDataSourceConfig() {
        const config = this.getDataSourceConfig();
        stateManager.setDataSourceConfig(config);
    }

    getDataSourceConfig() {
        return {
            type: 'sql',
            query: this.sqlTextarea ? this.sqlTextarea.value : ''
        };
    }

    setDataSourceConfig(config) {
        if (!config) return;

        if (config.type === 'sql' && this.sqlTextarea) {
            this.sqlTextarea.value = config.query || '';
            if (this.updateSqlHighlight) this.updateSqlHighlight();
        }
    }

    restoreState() {
        // Restore SQL from state
        const query = stateManager.getQuery();
        if (this.sqlTextarea && query) {
            this.sqlTextarea.value = query;
            if (this.updateSqlHighlight) this.updateSqlHighlight();
        }

        // Restore data source config if available
        const dsConfig = stateManager.getDataSourceConfig();
        if (dsConfig) {
            this.setDataSourceConfig(dsConfig);
        }
    }

    // UI Helpers
    setLoading(loading) {
        this.isLoading = loading;

        if (this.sqlExecuteBtn) {
            this.sqlExecuteBtn.disabled = loading;
            const originalText = this.sqlExecuteBtn.textContent;
            if (loading) {
                this.sqlExecuteBtn.dataset.originalText = originalText;
                this.sqlExecuteBtn.textContent = 'Loading...';
            } else {
                this.sqlExecuteBtn.textContent = this.sqlExecuteBtn.dataset.originalText || originalText;
            }
        }
    }

    showError(message) {
        this.statusArea.innerHTML = '';
        const error = this.createElement('div', { className: 'gb-datasource-error' }, message);
        this.statusArea.appendChild(error);
    }

    showSuccess(message) {
        this.statusArea.innerHTML = '';
        const success = this.createElement('div', { className: 'gb-datasource-success' }, message);
        this.statusArea.appendChild(success);
    }

    clearStatus() {
        this.statusArea.innerHTML = '';
    }

    // Public methods for external access
    setQuery(sql) {
        if (this.sqlTextarea) {
            this.sqlTextarea.value = sql;
            stateManager.setQuery(sql);
            if (this.updateSqlHighlight) this.updateSqlHighlight();
        }
    }

    getQuery() {
        return this.sqlTextarea ? this.sqlTextarea.value : '';
    }

    execute() {
        this.executeSql();
    }

    getActiveSourceType() {
        return 'sql';
    }
}

export { DataSourceEditor };
