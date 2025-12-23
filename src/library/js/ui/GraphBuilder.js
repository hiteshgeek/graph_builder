import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { TypeSwitcher } from './TypeSwitcher.js';
import { ConfigPanel } from './ConfigPanel.js';
import { DataExplorer } from './DataExplorer.js';
import { QueryEditor } from './QueryEditor.js';
import { PreviewPanel } from './PreviewPanel.js';
import { ThemeSwitcher } from './ThemeSwitcher.js';
import { debounce } from '../utils/helpers.js';

/**
 * GraphBuilder - Main orchestrator component
 */
class GraphBuilder extends BaseComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.typeSwitcher = null;
        this.configPanel = null;
        this.dataExplorer = null;
        this.queryEditor = null;
        this.previewPanel = null;
        this.themeSwitcher = null;
    }

    init() {
        this.render();
        this.initComponents();
        this.setupResizeHandler();
        this.initialized = true;
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-container' });

        // Header
        const header = this.createElement('div', { className: 'gb-header' });

        const titleSection = this.createElement('div', { className: 'gb-header-title' });
        const logo = this.createElement('h1', { className: 'gb-logo' }, 'Graph Builder');
        titleSection.appendChild(logo);

        const actions = this.createElement('div', { className: 'gb-header-actions' });

        // Type switcher container
        this.typeSwitcherContainer = this.createElement('div', { className: 'gb-header-types' });
        actions.appendChild(this.typeSwitcherContainer);

        // Theme switcher container
        this.themeSwitcherContainer = this.createElement('div', { className: 'gb-header-theme' });
        actions.appendChild(this.themeSwitcherContainer);

        header.appendChild(titleSection);
        header.appendChild(actions);

        // Main content - 3 column layout
        const main = this.createElement('div', { className: 'gb-main' });

        // Left sidebar (config)
        const sidebar = this.createElement('aside', { className: 'gb-sidebar' });
        this.configContainer = this.createElement('div', { className: 'gb-config-wrapper' });
        sidebar.appendChild(this.configContainer);

        // Middle column (data explorer + query)
        const middle = this.createElement('div', { className: 'gb-middle' });
        this.dataExplorerContainer = this.createElement('div', { className: 'gb-data-explorer-wrapper' });
        this.queryContainer = this.createElement('div', { className: 'gb-query-wrapper' });
        middle.appendChild(this.dataExplorerContainer);
        middle.appendChild(this.queryContainer);

        // Right column (preview)
        const content = this.createElement('div', { className: 'gb-content' });
        this.previewContainer = this.createElement('div', { className: 'gb-preview-wrapper' });
        content.appendChild(this.previewContainer);

        main.appendChild(sidebar);
        main.appendChild(middle);
        main.appendChild(content);

        this.element.appendChild(header);
        this.element.appendChild(main);

        this.container.appendChild(this.element);
    }

    initComponents() {
        // Theme switcher (init first to apply theme)
        this.themeSwitcher = new ThemeSwitcher(this.themeSwitcherContainer);
        this.themeSwitcher.init();

        // Type switcher
        this.typeSwitcher = new TypeSwitcher(this.typeSwitcherContainer);
        this.typeSwitcher.init();

        // Query editor (init before data explorer so we can pass reference)
        this.queryEditor = new QueryEditor(this.queryContainer, {
            apiBase: this.options.apiBase || ''
        });
        this.queryEditor.init();

        // Data explorer
        this.dataExplorer = new DataExplorer(this.dataExplorerContainer, {
            apiBase: this.options.apiBase || '',
            onFieldClick: (fieldName, tableName) => {
                // Insert field name into query
                this.queryEditor.insertText(fieldName);
            },
            onTableSelect: (tableName, fields) => {
                // Could auto-generate a basic SELECT query
            }
        });
        this.dataExplorer.init();

        // Config panel
        this.configPanel = new ConfigPanel(this.configContainer);
        this.configPanel.init();

        // Preview panel
        this.previewPanel = new PreviewPanel(this.previewContainer);
        this.previewPanel.init();
    }

    setupResizeHandler() {
        const handleResize = debounce(() => {
            if (this.previewPanel) {
                this.previewPanel.resize();
            }
        }, 100);

        window.addEventListener('resize', handleResize);
        this.eventBindings.push({
            element: window,
            event: 'resize',
            handler: handleResize
        });
    }

    // Public API

    setChartType(type) {
        stateManager.setChartType(type);
    }

    setQuery(sql) {
        if (this.queryEditor) {
            this.queryEditor.setQuery(sql);
        }
    }

    executeQuery() {
        if (this.queryEditor) {
            this.queryEditor.execute();
        }
    }

    getChartConfig() {
        return stateManager.getConfig();
    }

    getChartType() {
        return stateManager.getChartType();
    }

    getData() {
        return stateManager.getData();
    }

    exportChart(format = 'png') {
        if (this.previewPanel) {
            this.previewPanel.exportAsImage(format);
        }
    }

    resetState() {
        stateManager.resetState();
    }

    destroy() {
        if (this.typeSwitcher) {
            this.typeSwitcher.destroy();
            this.typeSwitcher = null;
        }
        if (this.configPanel) {
            this.configPanel.destroy();
            this.configPanel = null;
        }
        if (this.dataExplorer) {
            this.dataExplorer.destroy();
            this.dataExplorer = null;
        }
        if (this.queryEditor) {
            this.queryEditor.destroy();
            this.queryEditor = null;
        }
        if (this.previewPanel) {
            this.previewPanel.destroy();
            this.previewPanel = null;
        }
        if (this.themeSwitcher) {
            this.themeSwitcher.destroy();
            this.themeSwitcher = null;
        }
        super.destroy();
    }
}

export { GraphBuilder };
