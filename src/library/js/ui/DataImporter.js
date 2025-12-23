import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { EVENTS } from '../utils/constants.js';

/**
 * DataImporter - Import data from various sources
 * Supports: JSON, CSV, Excel (XLSX), PHP Array, API endpoint
 */
class DataImporter extends BaseComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.modalElement = null;
        this.activeTab = 'json';
    }

    init() {
        super.init();
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-data-importer' });

        // Import button
        const importBtn = this.createElement('button', {
            className: 'gb-import-btn',
            type: 'button',
            title: 'Import data from file or API'
        });

        const icon = this.createElement('span', { className: 'gb-import-btn-icon' });
        icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;

        const label = this.createElement('span', { className: 'gb-import-btn-label' }, 'Import Data');

        importBtn.appendChild(icon);
        importBtn.appendChild(label);

        this.bindEvent(importBtn, 'click', () => this.openModal());

        this.element.appendChild(importBtn);
        this.container.appendChild(this.element);
    }

    openModal() {
        if (this.modalElement) {
            this.modalElement.remove();
        }

        // Create modal backdrop
        const backdrop = this.createElement('div', { className: 'gb-modal-backdrop' });

        // Create modal
        const modal = this.createElement('div', { className: 'gb-modal gb-import-modal' });

        // Modal header
        const header = this.createElement('div', { className: 'gb-modal-header' });
        const title = this.createElement('h3', { className: 'gb-modal-title' }, 'Import Data');
        const closeBtn = this.createElement('button', { className: 'gb-modal-close', type: 'button' });
        closeBtn.innerHTML = '&times;';
        this.bindEvent(closeBtn, 'click', () => this.closeModal());

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Modal tabs
        const tabs = this.createElement('div', { className: 'gb-import-tabs' });
        const tabItems = [
            { id: 'json', label: 'JSON', icon: '{ }' },
            { id: 'csv', label: 'CSV', icon: '📄' },
            { id: 'excel', label: 'Excel', icon: '📊' },
            { id: 'php', label: 'PHP Array', icon: '🐘' },
            { id: 'api', label: 'API', icon: '🔗' }
        ];

        tabItems.forEach(tab => {
            const tabBtn = this.createElement('button', {
                className: `gb-import-tab ${tab.id === this.activeTab ? 'gb-import-tab--active' : ''}`,
                type: 'button',
                'data-tab': tab.id
            });
            tabBtn.innerHTML = `<span class="gb-import-tab-icon">${tab.icon}</span><span>${tab.label}</span>`;
            this.bindEvent(tabBtn, 'click', () => this.switchTab(tab.id));
            tabs.appendChild(tabBtn);
        });

        // Modal body with tab content
        const body = this.createElement('div', { className: 'gb-modal-body' });
        this.tabContent = this.createElement('div', { className: 'gb-import-content' });
        this.renderTabContent();
        body.appendChild(this.tabContent);

        // Modal footer
        const footer = this.createElement('div', { className: 'gb-modal-footer' });
        const cancelBtn = this.createElement('button', {
            className: 'gb-btn gb-btn-secondary',
            type: 'button'
        }, 'Cancel');
        const importActionBtn = this.createElement('button', {
            className: 'gb-btn gb-btn-primary',
            type: 'button'
        }, 'Import');

        this.bindEvent(cancelBtn, 'click', () => this.closeModal());
        this.bindEvent(importActionBtn, 'click', () => this.handleImport());

        this.importActionBtn = importActionBtn;
        footer.appendChild(cancelBtn);
        footer.appendChild(importActionBtn);

        modal.appendChild(header);
        modal.appendChild(tabs);
        modal.appendChild(body);
        modal.appendChild(footer);

        backdrop.appendChild(modal);

        // Close on backdrop click
        this.bindEvent(backdrop, 'click', (e) => {
            if (e.target === backdrop) this.closeModal();
        });

        // Close on Escape
        this.escHandler = (e) => {
            if (e.key === 'Escape') this.closeModal();
        };
        document.addEventListener('keydown', this.escHandler);

        this.modalElement = backdrop;
        this.tabs = tabs;
        document.body.appendChild(backdrop);

        // Focus first input
        setTimeout(() => {
            const firstInput = this.tabContent.querySelector('textarea, input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    closeModal() {
        if (this.modalElement) {
            this.modalElement.remove();
            this.modalElement = null;
        }
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
            this.escHandler = null;
        }
    }

    switchTab(tabId) {
        this.activeTab = tabId;

        // Update tab buttons
        this.tabs.querySelectorAll('.gb-import-tab').forEach(btn => {
            btn.classList.toggle('gb-import-tab--active', btn.dataset.tab === tabId);
        });

        this.renderTabContent();
    }

    renderTabContent() {
        this.tabContent.innerHTML = '';

        switch (this.activeTab) {
            case 'json':
                this.renderJsonTab();
                break;
            case 'csv':
                this.renderCsvTab();
                break;
            case 'excel':
                this.renderExcelTab();
                break;
            case 'php':
                this.renderPhpTab();
                break;
            case 'api':
                this.renderApiTab();
                break;
        }
    }

    renderJsonTab() {
        const wrapper = this.createElement('div', { className: 'gb-import-form' });

        // File upload
        const fileGroup = this.createElement('div', { className: 'gb-form-group' });
        const fileLabel = this.createElement('label', { className: 'gb-form-label' }, 'Upload JSON File');
        const fileInput = this.createElement('input', {
            type: 'file',
            accept: '.json,application/json',
            className: 'gb-file-input'
        });
        this.bindEvent(fileInput, 'change', (e) => this.handleFileSelect(e, 'json'));
        fileGroup.appendChild(fileLabel);
        fileGroup.appendChild(fileInput);

        // Or divider
        const divider = this.createElement('div', { className: 'gb-import-divider' }, 'or paste JSON directly');

        // Textarea
        const textGroup = this.createElement('div', { className: 'gb-form-group' });
        const textLabel = this.createElement('label', { className: 'gb-form-label' }, 'JSON Data');
        const textarea = this.createElement('textarea', {
            className: 'gb-import-textarea',
            placeholder: `[
  { "name": "Product A", "value": 100 },
  { "name": "Product B", "value": 200 },
  { "name": "Product C", "value": 150 }
]`,
            rows: 10
        });
        this.jsonTextarea = textarea;
        textGroup.appendChild(textLabel);
        textGroup.appendChild(textarea);

        wrapper.appendChild(fileGroup);
        wrapper.appendChild(divider);
        wrapper.appendChild(textGroup);
        this.tabContent.appendChild(wrapper);
    }

    renderCsvTab() {
        const wrapper = this.createElement('div', { className: 'gb-import-form' });

        // File upload
        const fileGroup = this.createElement('div', { className: 'gb-form-group' });
        const fileLabel = this.createElement('label', { className: 'gb-form-label' }, 'Upload CSV File');
        const fileInput = this.createElement('input', {
            type: 'file',
            accept: '.csv,text/csv',
            className: 'gb-file-input'
        });
        this.bindEvent(fileInput, 'change', (e) => this.handleFileSelect(e, 'csv'));
        fileGroup.appendChild(fileLabel);
        fileGroup.appendChild(fileInput);

        // Or divider
        const divider = this.createElement('div', { className: 'gb-import-divider' }, 'or paste CSV directly');

        // Textarea
        const textGroup = this.createElement('div', { className: 'gb-form-group' });
        const textLabel = this.createElement('label', { className: 'gb-form-label' }, 'CSV Data');
        const textarea = this.createElement('textarea', {
            className: 'gb-import-textarea',
            placeholder: `name,value
Product A,100
Product B,200
Product C,150`,
            rows: 10
        });
        this.csvTextarea = textarea;
        textGroup.appendChild(textLabel);
        textGroup.appendChild(textarea);

        // Options
        const optionsGroup = this.createElement('div', { className: 'gb-form-group gb-form-row' });

        const delimiterLabel = this.createElement('label', { className: 'gb-form-label-inline' }, 'Delimiter:');
        const delimiterSelect = this.createElement('select', { className: 'gb-form-select' });
        [',', ';', '\t', '|'].forEach(d => {
            const opt = this.createElement('option', { value: d }, d === '\t' ? 'Tab' : d);
            delimiterSelect.appendChild(opt);
        });
        this.csvDelimiter = delimiterSelect;

        const headerCheck = this.createElement('label', { className: 'gb-form-checkbox' });
        const headerInput = this.createElement('input', { type: 'checkbox', checked: true });
        this.csvHasHeader = headerInput;
        headerCheck.appendChild(headerInput);
        headerCheck.appendChild(document.createTextNode(' First row is header'));

        optionsGroup.appendChild(delimiterLabel);
        optionsGroup.appendChild(delimiterSelect);
        optionsGroup.appendChild(headerCheck);

        wrapper.appendChild(fileGroup);
        wrapper.appendChild(divider);
        wrapper.appendChild(textGroup);
        wrapper.appendChild(optionsGroup);
        this.tabContent.appendChild(wrapper);
    }

    renderExcelTab() {
        const wrapper = this.createElement('div', { className: 'gb-import-form' });

        // File upload
        const fileGroup = this.createElement('div', { className: 'gb-form-group' });
        const fileLabel = this.createElement('label', { className: 'gb-form-label' }, 'Upload Excel File (.xlsx, .xls)');
        const fileInput = this.createElement('input', {
            type: 'file',
            accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
            className: 'gb-file-input'
        });
        this.excelFileInput = fileInput;
        this.bindEvent(fileInput, 'change', (e) => this.handleFileSelect(e, 'excel'));
        fileGroup.appendChild(fileLabel);
        fileGroup.appendChild(fileInput);

        // Sheet selection (populated after file load)
        const sheetGroup = this.createElement('div', { className: 'gb-form-group', style: 'display: none;' });
        const sheetLabel = this.createElement('label', { className: 'gb-form-label' }, 'Select Sheet');
        const sheetSelect = this.createElement('select', { className: 'gb-form-select' });
        this.excelSheetSelect = sheetSelect;
        this.excelSheetGroup = sheetGroup;
        sheetGroup.appendChild(sheetLabel);
        sheetGroup.appendChild(sheetSelect);

        // Options
        const optionsGroup = this.createElement('div', { className: 'gb-form-group' });
        const headerCheck = this.createElement('label', { className: 'gb-form-checkbox' });
        const headerInput = this.createElement('input', { type: 'checkbox', checked: true });
        this.excelHasHeader = headerInput;
        headerCheck.appendChild(headerInput);
        headerCheck.appendChild(document.createTextNode(' First row is header'));
        optionsGroup.appendChild(headerCheck);

        // Note about SheetJS
        const note = this.createElement('div', { className: 'gb-import-note' });
        note.innerHTML = `<strong>Note:</strong> Excel parsing requires <a href="https://sheetjs.com/" target="_blank">SheetJS</a> library.
        Add <code>&lt;script src="https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js"&gt;&lt;/script&gt;</code> to your page.`;

        wrapper.appendChild(fileGroup);
        wrapper.appendChild(sheetGroup);
        wrapper.appendChild(optionsGroup);
        wrapper.appendChild(note);
        this.tabContent.appendChild(wrapper);
    }

    renderPhpTab() {
        const wrapper = this.createElement('div', { className: 'gb-import-form' });

        // Textarea
        const textGroup = this.createElement('div', { className: 'gb-form-group' });
        const textLabel = this.createElement('label', { className: 'gb-form-label' }, 'PHP Array (will be converted to JSON)');
        const textarea = this.createElement('textarea', {
            className: 'gb-import-textarea',
            placeholder: `[
    ['name' => 'Product A', 'value' => 100],
    ['name' => 'Product B', 'value' => 200],
    ['name' => 'Product C', 'value' => 150],
]`,
            rows: 10
        });
        this.phpTextarea = textarea;
        textGroup.appendChild(textLabel);
        textGroup.appendChild(textarea);

        // Help text
        const help = this.createElement('div', { className: 'gb-import-help' });
        help.innerHTML = `<strong>Supported formats:</strong>
        <ul>
            <li>Associative arrays: <code>['key' => 'value']</code></li>
            <li>Indexed arrays: <code>['value1', 'value2']</code></li>
            <li>Mixed: <code>[['name' => 'A', 'val' => 1], ...]</code></li>
        </ul>`;

        wrapper.appendChild(textGroup);
        wrapper.appendChild(help);
        this.tabContent.appendChild(wrapper);
    }

    renderApiTab() {
        const wrapper = this.createElement('div', { className: 'gb-import-form' });

        // URL input
        const urlGroup = this.createElement('div', { className: 'gb-form-group' });
        const urlLabel = this.createElement('label', { className: 'gb-form-label' }, 'API Endpoint URL');
        const urlInput = this.createElement('input', {
            type: 'url',
            className: 'gb-form-input',
            placeholder: 'https://api.example.com/data'
        });
        this.apiUrlInput = urlInput;
        urlGroup.appendChild(urlLabel);
        urlGroup.appendChild(urlInput);

        // Method
        const methodGroup = this.createElement('div', { className: 'gb-form-group' });
        const methodLabel = this.createElement('label', { className: 'gb-form-label' }, 'HTTP Method');
        const methodSelect = this.createElement('select', { className: 'gb-form-select' });
        ['GET', 'POST'].forEach(m => {
            const opt = this.createElement('option', { value: m }, m);
            methodSelect.appendChild(opt);
        });
        this.apiMethod = methodSelect;
        methodGroup.appendChild(methodLabel);
        methodGroup.appendChild(methodSelect);

        // Headers
        const headersGroup = this.createElement('div', { className: 'gb-form-group' });
        const headersLabel = this.createElement('label', { className: 'gb-form-label' }, 'Headers (JSON)');
        const headersTextarea = this.createElement('textarea', {
            className: 'gb-import-textarea gb-import-textarea--small',
            placeholder: `{
  "Authorization": "Bearer your-token",
  "Content-Type": "application/json"
}`,
            rows: 4
        });
        this.apiHeaders = headersTextarea;
        headersGroup.appendChild(headersLabel);
        headersGroup.appendChild(headersTextarea);

        // Body (for POST)
        const bodyGroup = this.createElement('div', { className: 'gb-form-group' });
        const bodyLabel = this.createElement('label', { className: 'gb-form-label' }, 'Request Body (for POST)');
        const bodyTextarea = this.createElement('textarea', {
            className: 'gb-import-textarea gb-import-textarea--small',
            placeholder: '{ "query": "..." }',
            rows: 4
        });
        this.apiBody = bodyTextarea;
        bodyGroup.appendChild(bodyLabel);
        bodyGroup.appendChild(bodyTextarea);

        // Data path
        const pathGroup = this.createElement('div', { className: 'gb-form-group' });
        const pathLabel = this.createElement('label', { className: 'gb-form-label' }, 'Data Path (optional)');
        const pathInput = this.createElement('input', {
            type: 'text',
            className: 'gb-form-input',
            placeholder: 'data.results or leave empty for root'
        });
        this.apiDataPath = pathInput;
        pathGroup.appendChild(pathLabel);
        pathGroup.appendChild(pathInput);

        // Test button
        const testBtn = this.createElement('button', {
            className: 'gb-btn gb-btn-secondary',
            type: 'button'
        }, 'Test Connection');
        this.bindEvent(testBtn, 'click', () => this.testApiConnection());

        // Status
        this.apiStatus = this.createElement('div', { className: 'gb-import-status' });

        wrapper.appendChild(urlGroup);
        wrapper.appendChild(methodGroup);
        wrapper.appendChild(headersGroup);
        wrapper.appendChild(bodyGroup);
        wrapper.appendChild(pathGroup);
        wrapper.appendChild(testBtn);
        wrapper.appendChild(this.apiStatus);
        this.tabContent.appendChild(wrapper);
    }

    handleFileSelect(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        if (type === 'json') {
            reader.onload = (e) => {
                this.jsonTextarea.value = e.target.result;
            };
            reader.readAsText(file);
        } else if (type === 'csv') {
            reader.onload = (e) => {
                this.csvTextarea.value = e.target.result;
            };
            reader.readAsText(file);
        } else if (type === 'excel') {
            reader.onload = (e) => {
                this.parseExcel(e.target.result);
            };
            reader.readAsArrayBuffer(file);
        }
    }

    parseExcel(data) {
        if (typeof XLSX === 'undefined') {
            this.showError('SheetJS library not loaded. Please include xlsx.full.min.js');
            return;
        }

        try {
            const workbook = XLSX.read(data, { type: 'array' });
            this.excelWorkbook = workbook;

            // Populate sheet selector
            this.excelSheetSelect.innerHTML = '';
            workbook.SheetNames.forEach(name => {
                const opt = this.createElement('option', { value: name }, name);
                this.excelSheetSelect.appendChild(opt);
            });

            this.excelSheetGroup.style.display = 'block';
        } catch (error) {
            this.showError('Failed to parse Excel file: ' + error.message);
        }
    }

    async testApiConnection() {
        const url = this.apiUrlInput.value.trim();
        if (!url) {
            this.showApiStatus('Please enter a URL', 'error');
            return;
        }

        this.showApiStatus('Testing connection...', 'loading');

        try {
            const data = await this.fetchApiData();
            const count = Array.isArray(data) ? data.length : Object.keys(data).length;
            this.showApiStatus(`Success! Found ${count} items`, 'success');
        } catch (error) {
            this.showApiStatus('Error: ' + error.message, 'error');
        }
    }

    showApiStatus(message, type) {
        this.apiStatus.className = `gb-import-status gb-import-status--${type}`;
        this.apiStatus.textContent = message;
    }

    async fetchApiData() {
        const url = this.apiUrlInput.value.trim();
        const method = this.apiMethod.value;

        let headers = {};
        try {
            const headersText = this.apiHeaders.value.trim();
            if (headersText) {
                headers = JSON.parse(headersText);
            }
        } catch (e) {
            throw new Error('Invalid headers JSON');
        }

        const options = { method, headers };

        if (method === 'POST') {
            const bodyText = this.apiBody.value.trim();
            if (bodyText) {
                options.body = bodyText;
                if (!headers['Content-Type']) {
                    headers['Content-Type'] = 'application/json';
                }
            }
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        let data = await response.json();

        // Navigate to data path if specified
        const dataPath = this.apiDataPath.value.trim();
        if (dataPath) {
            const parts = dataPath.split('.');
            for (const part of parts) {
                if (data && typeof data === 'object') {
                    data = data[part];
                } else {
                    throw new Error(`Path "${dataPath}" not found in response`);
                }
            }
        }

        return data;
    }

    async handleImport() {
        this.importActionBtn.disabled = true;
        this.importActionBtn.textContent = 'Importing...';

        try {
            let data;

            switch (this.activeTab) {
                case 'json':
                    data = this.parseJson();
                    break;
                case 'csv':
                    data = this.parseCsv();
                    break;
                case 'excel':
                    data = this.parseExcelData();
                    break;
                case 'php':
                    data = this.parsePhpArray();
                    break;
                case 'api':
                    data = await this.fetchApiData();
                    break;
            }

            if (!data || (Array.isArray(data) && data.length === 0)) {
                throw new Error('No data to import');
            }

            // Ensure data is array
            if (!Array.isArray(data)) {
                data = [data];
            }

            // Extract columns from first row
            const columns = Object.keys(data[0]);

            // Set data in state manager
            stateManager.setData(data, columns);

            this.closeModal();
            this.emit(EVENTS.DATA_UPDATED, { data, columns, source: this.activeTab });

        } catch (error) {
            this.showError(error.message);
        } finally {
            this.importActionBtn.disabled = false;
            this.importActionBtn.textContent = 'Import';
        }
    }

    parseJson() {
        const text = this.jsonTextarea.value.trim();
        if (!text) {
            throw new Error('Please enter JSON data');
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error('Invalid JSON: ' + e.message);
        }
    }

    parseCsv() {
        const text = this.csvTextarea.value.trim();
        if (!text) {
            throw new Error('Please enter CSV data');
        }

        const delimiter = this.csvDelimiter.value;
        const hasHeader = this.csvHasHeader.checked;
        const lines = text.split(/\r?\n/).filter(line => line.trim());

        if (lines.length === 0) {
            throw new Error('No data found');
        }

        const parseRow = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === delimiter && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        };

        let headers;
        let dataStart = 0;

        if (hasHeader) {
            headers = parseRow(lines[0]);
            dataStart = 1;
        } else {
            const firstRow = parseRow(lines[0]);
            headers = firstRow.map((_, i) => `Column${i + 1}`);
        }

        const data = [];
        for (let i = dataStart; i < lines.length; i++) {
            const values = parseRow(lines[i]);
            const row = {};
            headers.forEach((header, idx) => {
                let value = values[idx] || '';
                // Try to convert numbers
                const num = parseFloat(value);
                row[header] = !isNaN(num) && isFinite(num) ? num : value;
            });
            data.push(row);
        }

        return data;
    }

    parseExcelData() {
        if (!this.excelWorkbook) {
            throw new Error('Please select an Excel file');
        }

        const sheetName = this.excelSheetSelect.value;
        const sheet = this.excelWorkbook.Sheets[sheetName];
        const hasHeader = this.excelHasHeader.checked;

        const jsonData = XLSX.utils.sheet_to_json(sheet, {
            header: hasHeader ? undefined : 1,
            defval: ''
        });

        return jsonData;
    }

    parsePhpArray() {
        let text = this.phpTextarea.value.trim();
        if (!text) {
            throw new Error('Please enter PHP array data');
        }

        // Convert PHP array syntax to JSON
        // First, protect strings by replacing them with placeholders
        const strings = [];

        // Match single-quoted strings (handling escaped single quotes)
        text = text.replace(/'((?:[^'\\]|\\.)*)'/g, (match, content) => {
            const placeholder = `___PHPSTR${strings.length}___`;
            // Unescape PHP single quote escapes and escape for JSON
            const jsonContent = content
                .replace(/\\'/g, "'")  // PHP \' -> '
                .replace(/\\/g, '\\\\') // Escape backslashes for JSON
                .replace(/"/g, '\\"');  // Escape double quotes for JSON
            strings.push(`"${jsonContent}"`);
            return placeholder;
        });

        // Match double-quoted strings
        text = text.replace(/"((?:[^"\\]|\\.)*)"/g, (match, content) => {
            const placeholder = `___PHPSTR${strings.length}___`;
            strings.push(`"${content}"`);
            return placeholder;
        });

        // Handle PHP array() syntax first
        text = text.replace(/\barray\s*\(/gi, '[');
        text = text.replace(/\)\s*([,\]])/g, ']$1');

        // Convert => to :
        text = text.replace(/=>/g, ':');

        // Convert innermost associative arrays [...] to objects {...}
        // An associative array has key:value pairs at its own level
        // We process from innermost outward, only converting arrays that directly contain :
        let prevText = '';
        while (prevText !== text) {
            prevText = text;
            // Match innermost [...] (no nested brackets inside)
            // Only convert if it contains a : that's a key-value separator
            // Pattern: look for PHPSTR followed by : (indicating key => value)
            text = text.replace(/\[([^\[\]\{\}]*)\]/g, (match, content) => {
                // Check if this array has key:value pairs (PHPSTR followed by :)
                if (/___PHPSTR\d+___\s*:/.test(content)) {
                    return '{' + content + '}';
                }
                return match; // Keep as array
            });
        }

        // Handle trailing commas before ] or }
        text = text.replace(/,(\s*[\]\}])/g, '$1');

        // Restore strings
        strings.forEach((str, i) => {
            text = text.replace(new RegExp(`___PHPSTR${i}___`, 'g'), str);
        });

        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error('Failed to parse PHP array. Check syntax: ' + e.message);
        }
    }

    showError(message) {
        // Show error in modal
        let errorEl = this.tabContent.querySelector('.gb-import-error');
        if (!errorEl) {
            errorEl = this.createElement('div', { className: 'gb-import-error' });
            this.tabContent.insertBefore(errorEl, this.tabContent.firstChild);
        }
        errorEl.textContent = message;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorEl.parentNode) {
                errorEl.remove();
            }
        }, 5000);
    }

    destroy() {
        this.closeModal();
        super.destroy();
    }
}

export { DataImporter };
