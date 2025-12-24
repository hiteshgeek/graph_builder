import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../utils/constants.js';
import { ApiClient } from '../data/ApiClient.js';
import { QueryValidator } from '../data/QueryValidator.js';

/**
 * DataSourceEditor - Editor for multiple data source types (SQL, API, Callback, Static)
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

        // Source Type Tabs
        const tabsContainer = this.createElement('div', { className: 'gb-datasource-tabs' });

        const sourceTypes = [
            { id: 'sql', label: 'SQL Query', icon: this.getSqlIcon() },
            { id: 'api', label: 'API', icon: this.getApiIcon() },
            { id: 'callback', label: 'Callback', icon: this.getCallbackIcon() },
            { id: 'static', label: 'Static Data', icon: this.getStaticIcon() }
        ];

        sourceTypes.forEach(source => {
            const tab = this.createElement('button', {
                className: 'gb-datasource-tab',
                type: 'button',
                'data-source': source.id
            });
            tab.innerHTML = source.icon + '<span>' + source.label + '</span>';
            this.bindEvent(tab, 'click', () => this.switchSource(source.id));
            tabsContainer.appendChild(tab);
        });

        this.tabsContainer = tabsContainer;

        // Content panels for each source type
        this.panelsContainer = this.createElement('div', { className: 'gb-datasource-panels' });

        // SQL Panel
        this.sqlPanel = this.createSqlPanel();
        this.panelsContainer.appendChild(this.sqlPanel);

        // API Panel
        this.apiPanel = this.createApiPanel();
        this.panelsContainer.appendChild(this.apiPanel);

        // Callback Panel
        this.callbackPanel = this.createCallbackPanel();
        this.panelsContainer.appendChild(this.callbackPanel);

        // Static Panel
        this.staticPanel = this.createStaticPanel();
        this.panelsContainer.appendChild(this.staticPanel);

        // Status area
        this.statusArea = this.createElement('div', { className: 'gb-datasource-status' });

        this.element.appendChild(tabsContainer);
        this.element.appendChild(this.panelsContainer);
        this.element.appendChild(this.statusArea);

        this.container.appendChild(this.element);

        // Set initial active tab
        this.switchSource(this.activeSourceType);
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

    createApiPanel() {
        const panel = this.createElement('div', {
            className: 'gb-datasource-panel',
            'data-panel': 'api'
        });

        // URL field
        const urlGroup = this.createFieldGroup('API URL *', 'text', 'apiUrl', 'https://api.example.com/data');

        // Method select
        const methodGroup = this.createElement('div', { className: 'gb-datasource-field' });
        const methodLabel = this.createElement('label', {}, 'Method');
        this.apiMethodSelect = this.createElement('select', { className: 'gb-datasource-select' });
        this.apiMethodSelect.innerHTML = '<option value="GET">GET</option><option value="POST">POST</option>';
        methodGroup.appendChild(methodLabel);
        methodGroup.appendChild(this.apiMethodSelect);

        // Headers (JSON)
        const headersGroup = this.createElement('div', { className: 'gb-datasource-field' });
        const headersLabel = this.createElement('label', {}, 'Headers (JSON)');
        this.apiHeadersInput = this.createElement('textarea', {
            className: 'gb-datasource-textarea gb-datasource-textarea--small',
            placeholder: '{"Authorization": "Bearer token", "Content-Type": "application/json"}'
        });
        headersGroup.appendChild(headersLabel);
        headersGroup.appendChild(this.apiHeadersInput);

        // Body (for POST)
        const bodyGroup = this.createElement('div', { className: 'gb-datasource-field' });
        const bodyLabel = this.createElement('label', {}, 'Request Body (POST only)');
        this.apiBodyInput = this.createElement('textarea', {
            className: 'gb-datasource-textarea gb-datasource-textarea--small',
            placeholder: '{"param": "value"}'
        });
        bodyGroup.appendChild(bodyLabel);
        bodyGroup.appendChild(this.apiBodyInput);

        // Data Path
        const dataPathGroup = this.createFieldGroup('Data Path', 'text', 'apiDataPath', 'data.results (dot notation)');

        // Execute button
        const btnContainer = this.createElement('div', { className: 'gb-datasource-buttons' });
        this.apiExecuteBtn = this.createElement('button', {
            className: 'gb-datasource-btn gb-datasource-btn--primary',
            type: 'button'
        }, 'Fetch Data');
        this.bindEvent(this.apiExecuteBtn, 'click', () => this.executeApi());
        btnContainer.appendChild(this.apiExecuteBtn);

        panel.appendChild(urlGroup);
        panel.appendChild(methodGroup);
        panel.appendChild(headersGroup);
        panel.appendChild(bodyGroup);
        panel.appendChild(dataPathGroup);
        panel.appendChild(btnContainer);

        // Store references
        this.apiUrlInput = urlGroup.querySelector('input');
        this.apiDataPathInput = dataPathGroup.querySelector('input');

        return panel;
    }

    createCallbackPanel() {
        const panel = this.createElement('div', {
            className: 'gb-datasource-panel',
            'data-panel': 'callback'
        });

        // Info box
        const infoBox = this.createElement('div', { className: 'gb-datasource-info' });
        infoBox.innerHTML = '<strong>Note:</strong> Callback sources call a PHP class method to fetch data. The class must be in an allowed namespace configured on the server.';

        // Class field
        const classGroup = this.createFieldGroup('Class Name *', 'text', 'callbackClass', 'App\\Charts\\SalesData');

        // Method field
        const methodGroup = this.createFieldGroup('Method Name *', 'text', 'callbackMethod', 'getData');

        // Params (JSON)
        const paramsGroup = this.createElement('div', { className: 'gb-datasource-field' });
        const paramsLabel = this.createElement('label', {}, 'Parameters (JSON)');
        this.callbackParamsInput = this.createElement('textarea', {
            className: 'gb-datasource-textarea gb-datasource-textarea--small',
            placeholder: '{"year": 2024, "region": "north"}'
        });
        paramsGroup.appendChild(paramsLabel);
        paramsGroup.appendChild(this.callbackParamsInput);

        // Execute button
        const btnContainer = this.createElement('div', { className: 'gb-datasource-buttons' });
        this.callbackExecuteBtn = this.createElement('button', {
            className: 'gb-datasource-btn gb-datasource-btn--primary',
            type: 'button'
        }, 'Execute Callback');
        this.bindEvent(this.callbackExecuteBtn, 'click', () => this.executeCallback());
        btnContainer.appendChild(this.callbackExecuteBtn);

        panel.appendChild(infoBox);
        panel.appendChild(classGroup);
        panel.appendChild(methodGroup);
        panel.appendChild(paramsGroup);
        panel.appendChild(btnContainer);

        // Store references
        this.callbackClassInput = classGroup.querySelector('input');
        this.callbackMethodInput = methodGroup.querySelector('input');

        return panel;
    }

    createStaticPanel() {
        const panel = this.createElement('div', {
            className: 'gb-datasource-panel',
            'data-panel': 'static'
        });

        // Info box
        const infoBox = this.createElement('div', { className: 'gb-datasource-info' });
        infoBox.innerHTML = '<strong>Static Data:</strong> Enter JSON array data directly. Useful for small fixed datasets or testing.';

        // Data textarea
        const dataGroup = this.createElement('div', { className: 'gb-datasource-field' });
        const dataLabel = this.createElement('label', {}, 'JSON Data *');
        this.staticDataInput = this.createElement('textarea', {
            className: 'gb-datasource-textarea',
            placeholder: '[\n  {"name": "Category A", "value": 100},\n  {"name": "Category B", "value": 200},\n  {"name": "Category C", "value": 150}\n]'
        });
        dataGroup.appendChild(dataLabel);
        dataGroup.appendChild(this.staticDataInput);

        // Buttons
        const btnContainer = this.createElement('div', { className: 'gb-datasource-buttons' });

        const formatBtn = this.createElement('button', {
            className: 'gb-datasource-btn gb-datasource-btn--secondary',
            type: 'button'
        }, 'Format JSON');
        this.bindEvent(formatBtn, 'click', () => this.formatStaticJson());

        this.staticApplyBtn = this.createElement('button', {
            className: 'gb-datasource-btn gb-datasource-btn--primary',
            type: 'button'
        }, 'Apply Data');
        this.bindEvent(this.staticApplyBtn, 'click', () => this.applyStaticData());

        btnContainer.appendChild(formatBtn);
        btnContainer.appendChild(this.staticApplyBtn);

        panel.appendChild(infoBox);
        panel.appendChild(dataGroup);
        panel.appendChild(btnContainer);

        return panel;
    }

    createFieldGroup(label, type, name, placeholder) {
        const group = this.createElement('div', { className: 'gb-datasource-field' });
        const labelEl = this.createElement('label', {}, label);
        const input = this.createElement('input', {
            type: type,
            className: 'gb-datasource-input',
            name: name,
            placeholder: placeholder
        });
        group.appendChild(labelEl);
        group.appendChild(input);
        return group;
    }

    switchSource(sourceType) {
        this.activeSourceType = sourceType;

        // Update tabs
        this.tabsContainer.querySelectorAll('.gb-datasource-tab').forEach(tab => {
            tab.classList.toggle('gb-datasource-tab--active', tab.dataset.source === sourceType);
        });

        // Update panels
        this.panelsContainer.querySelectorAll('.gb-datasource-panel').forEach(panel => {
            panel.classList.toggle('gb-datasource-panel--active', panel.dataset.panel === sourceType);
        });

        // Save to state
        this.saveDataSourceConfig();

        // Clear status
        this.clearStatus();
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

        this.setLoading(true, 'sql');
        this.clearStatus();

        try {
            const result = await this.apiClient.executeQuery(sql);
            stateManager.setData(result.data, result.columns);
            this.showSuccess(`Returned ${result.rowCount} rows`);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false, 'sql');
        }
    }

    // API Methods
    async executeApi() {
        if (this.isLoading) return;

        const url = this.apiUrlInput.value.trim();
        if (!url) {
            this.showError('API URL is required');
            return;
        }

        this.setLoading(true, 'api');
        this.clearStatus();

        try {
            const config = {
                url: url,
                method: this.apiMethodSelect.value,
                headers: this.apiHeadersInput.value.trim() || '{}',
                body: this.apiBodyInput.value.trim() || null,
                dataPath: this.apiDataPathInput.value.trim() || null
            };

            const result = await this.apiClient.fetchApiSource(config);

            if (result.data && result.data.length > 0) {
                const columns = Object.keys(result.data[0]);
                stateManager.setData(result.data, columns);
                this.showSuccess(`Fetched ${result.data.length} rows`);
            } else {
                this.showError('No data returned from API');
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false, 'api');
        }
    }

    // Callback Methods
    async executeCallback() {
        if (this.isLoading) return;

        const className = this.callbackClassInput.value.trim();
        const methodName = this.callbackMethodInput.value.trim();

        if (!className || !methodName) {
            this.showError('Class name and method name are required');
            return;
        }

        this.setLoading(true, 'callback');
        this.clearStatus();

        try {
            const config = {
                className: className,
                methodName: methodName,
                params: this.callbackParamsInput.value.trim() || '{}'
            };

            const result = await this.apiClient.executeCallback(config);

            if (result.data && result.data.length > 0) {
                const columns = Object.keys(result.data[0]);
                stateManager.setData(result.data, columns);
                this.showSuccess(`Returned ${result.data.length} rows`);
            } else {
                this.showError('No data returned from callback');
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false, 'callback');
        }
    }

    // Static Methods
    formatStaticJson() {
        const data = this.staticDataInput.value.trim();
        if (!data) return;

        try {
            const parsed = JSON.parse(data);
            this.staticDataInput.value = JSON.stringify(parsed, null, 2);
        } catch (e) {
            this.showError('Invalid JSON: ' + e.message);
        }
    }

    applyStaticData() {
        const data = this.staticDataInput.value.trim();
        if (!data) {
            this.showError('Please enter JSON data');
            return;
        }

        try {
            const parsed = JSON.parse(data);

            if (!Array.isArray(parsed)) {
                this.showError('Data must be a JSON array');
                return;
            }

            if (parsed.length === 0) {
                this.showError('Data array is empty');
                return;
            }

            const columns = Object.keys(parsed[0]);
            stateManager.setData(parsed, columns);
            this.showSuccess(`Applied ${parsed.length} rows`);
            this.saveDataSourceConfig();
        } catch (e) {
            this.showError('Invalid JSON: ' + e.message);
        }
    }

    // State Management
    saveDataSourceConfig() {
        const config = this.getDataSourceConfig();
        stateManager.setDataSourceConfig(config);
    }

    getDataSourceConfig() {
        const config = {
            type: this.activeSourceType
        };

        switch (this.activeSourceType) {
            case 'sql':
                config.query = this.sqlTextarea ? this.sqlTextarea.value : '';
                break;
            case 'api':
                config.apiUrl = this.apiUrlInput ? this.apiUrlInput.value : '';
                config.apiMethod = this.apiMethodSelect ? this.apiMethodSelect.value : 'GET';
                config.apiHeaders = this.apiHeadersInput ? this.apiHeadersInput.value : '';
                config.apiBody = this.apiBodyInput ? this.apiBodyInput.value : '';
                config.apiDataPath = this.apiDataPathInput ? this.apiDataPathInput.value : '';
                break;
            case 'callback':
                config.callbackClass = this.callbackClassInput ? this.callbackClassInput.value : '';
                config.callbackMethod = this.callbackMethodInput ? this.callbackMethodInput.value : '';
                config.callbackParams = this.callbackParamsInput ? this.callbackParamsInput.value : '';
                break;
            case 'static':
                config.staticData = this.staticDataInput ? this.staticDataInput.value : '';
                break;
        }

        return config;
    }

    setDataSourceConfig(config) {
        if (!config || !config.type) return;

        this.activeSourceType = config.type;

        switch (config.type) {
            case 'sql':
                if (this.sqlTextarea) {
                    this.sqlTextarea.value = config.query || '';
                    if (this.updateSqlHighlight) this.updateSqlHighlight();
                }
                break;
            case 'api':
                if (this.apiUrlInput) this.apiUrlInput.value = config.apiUrl || '';
                if (this.apiMethodSelect) this.apiMethodSelect.value = config.apiMethod || 'GET';
                if (this.apiHeadersInput) this.apiHeadersInput.value = config.apiHeaders || '';
                if (this.apiBodyInput) this.apiBodyInput.value = config.apiBody || '';
                if (this.apiDataPathInput) this.apiDataPathInput.value = config.apiDataPath || '';
                break;
            case 'callback':
                if (this.callbackClassInput) this.callbackClassInput.value = config.callbackClass || '';
                if (this.callbackMethodInput) this.callbackMethodInput.value = config.callbackMethod || '';
                if (this.callbackParamsInput) this.callbackParamsInput.value = config.callbackParams || '';
                break;
            case 'static':
                if (this.staticDataInput) this.staticDataInput.value = config.staticData || '';
                break;
        }

        this.switchSource(config.type);
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
    setLoading(loading, sourceType) {
        this.isLoading = loading;

        const btnMap = {
            sql: this.sqlExecuteBtn,
            api: this.apiExecuteBtn,
            callback: this.callbackExecuteBtn,
            static: this.staticApplyBtn
        };

        const btn = btnMap[sourceType];
        if (btn) {
            btn.disabled = loading;
            const originalText = btn.textContent;
            if (loading) {
                btn.dataset.originalText = originalText;
                btn.textContent = 'Loading...';
            } else {
                btn.textContent = btn.dataset.originalText || originalText;
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
        switch (this.activeSourceType) {
            case 'sql':
                this.executeSql();
                break;
            case 'api':
                this.executeApi();
                break;
            case 'callback':
                this.executeCallback();
                break;
            case 'static':
                this.applyStaticData();
                break;
        }
    }

    getActiveSourceType() {
        return this.activeSourceType;
    }

    // Icons
    getSqlIcon() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>';
    }

    getApiIcon() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
    }

    getCallbackIcon() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></svg>';
    }

    getStaticIcon() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>';
    }
}

export { DataSourceEditor };
