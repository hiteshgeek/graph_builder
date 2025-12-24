import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { apiClient } from '../data/ApiClient.js';
import { TypeSwitcher } from './TypeSwitcher.js';
import { ConfigPanel } from './ConfigPanel.js';
import { DataExplorer } from './DataExplorer.js';
import { DataMapping } from './DataMapping.js';
import { DataImporter } from './DataImporter.js';
import { QueryEditor } from './QueryEditor.js';
import { QueryResults } from './QueryResults.js';
import { PreviewPanel } from './PreviewPanel.js';
import { ThemeSwitcher } from './ThemeSwitcher.js';
import { SaveGraphDialog } from './SaveGraphDialog.js';
import { debounce } from '../utils/helpers.js';

// Sidebar tab definitions
const SIDEBAR_TABS = [
    { id: 'config', label: 'Config', icon: 'settings' },
    { id: 'data', label: 'Data', icon: 'database' },
    { id: 'mapping', label: 'Mapping', icon: 'link' }
];

/**
 * GraphBuilder - Main orchestrator component
 */
class GraphBuilder extends BaseComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.typeSwitcher = null;
        this.configPanel = null;
        this.dataExplorer = null;
        this.dataMapping = null;
        this.dataImporter = null;
        this.queryEditor = null;
        this.previewPanel = null;
        this.themeSwitcher = null;
        this.saveDialog = null;
        this.queryResults = null;
        this.activeTab = 'config';
    }

    init() {
        this.render();
        this.initComponents();
        this.setupResizeHandler();
        this.restoreActiveTab();
        this.initialized = true;

        // Check if editing a saved graph
        if (window.GRAPH_BUILDER_EDIT_ID) {
            this.loadSavedGraph(window.GRAPH_BUILDER_EDIT_ID);
        }
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

        // Save button
        const saveBtn = this.createElement('button', {
            className: 'gb-header-save-btn',
            type: 'button',
            title: 'Save graph configuration'
        });
        saveBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
        </svg>
        Save`;
        this.bindEvent(saveBtn, 'click', () => this.showSaveDialog());
        actions.appendChild(saveBtn);

        // Saved graphs link
        const graphsLink = this.createElement('a', {
            className: 'gb-header-link',
            href: 'graphs/'
        });
        graphsLink.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
        </svg>
        Saved`;
        actions.appendChild(graphsLink);

        // Usage link (after theme switcher, like in usage page)
        const usageLink = this.createElement('a', {
            className: 'gb-header-link',
            href: 'usage/'
        });
        usageLink.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
        Usage Examples`;
        actions.appendChild(usageLink);

        header.appendChild(titleSection);
        header.appendChild(actions);

        // Main content - 2 column layout (tabbed sidebar + preview)
        const main = this.createElement('div', { className: 'gb-main' });

        // Left sidebar with tabs
        const sidebar = this.createElement('aside', { className: 'gb-sidebar' });

        // Tab navigation
        this.tabNav = this.createElement('div', { className: 'gb-sidebar-tabs' });
        this.tabButtons = {};

        SIDEBAR_TABS.forEach(tab => {
            const btn = this.createElement('button', {
                className: `gb-sidebar-tab${tab.id === this.activeTab ? ' gb-sidebar-tab--active' : ''}`,
                type: 'button',
                'data-tab': tab.id
            });

            const icon = this.createElement('span', { className: 'gb-sidebar-tab-icon' });
            icon.innerHTML = this.getTabIcon(tab.icon);

            const label = this.createElement('span', { className: 'gb-sidebar-tab-label' }, tab.label);

            btn.appendChild(icon);
            btn.appendChild(label);

            this.bindEvent(btn, 'click', () => this.switchTab(tab.id));

            this.tabButtons[tab.id] = btn;
            this.tabNav.appendChild(btn);
        });

        sidebar.appendChild(this.tabNav);

        // Tab content panels
        this.tabPanels = {};

        // Config tab panel
        this.tabPanels.config = this.createElement('div', {
            className: 'gb-sidebar-panel gb-sidebar-panel--config',
            'data-panel': 'config'
        });
        this.configContainer = this.createElement('div', { className: 'gb-config-wrapper' });
        this.tabPanels.config.appendChild(this.configContainer);

        // Data tab panel (table selection + query)
        this.tabPanels.data = this.createElement('div', {
            className: 'gb-sidebar-panel gb-sidebar-panel--data',
            'data-panel': 'data'
        });

        // Data panel header with import button
        const dataPanelHeader = this.createElement('div', { className: 'gb-data-panel-header' });
        const dataPanelTitle = this.createElement('span', { className: 'gb-data-panel-title' }, 'Data Source');
        this.dataImporterContainer = this.createElement('div', { className: 'gb-data-importer-wrapper' });
        dataPanelHeader.appendChild(dataPanelTitle);
        dataPanelHeader.appendChild(this.dataImporterContainer);

        this.dataExplorerContainer = this.createElement('div', { className: 'gb-data-explorer-wrapper' });

        // Resizer between data explorer and query
        const dataResizer = this.createElement('div', { className: 'gb-data-resizer' });
        this.initDataResizer(dataResizer);

        this.queryContainer = this.createElement('div', { className: 'gb-query-wrapper' });

        // Resizer between query and results
        const queryResultsResizer = this.createElement('div', { className: 'gb-data-resizer gb-query-results-resizer' });
        this.initQueryResultsResizer(queryResultsResizer);

        // Results container
        this.queryResultsContainer = this.createElement('div', { className: 'gb-query-results-wrapper' });

        this.tabPanels.data.appendChild(dataPanelHeader);
        this.tabPanels.data.appendChild(this.dataExplorerContainer);
        this.tabPanels.data.appendChild(dataResizer);
        this.tabPanels.data.appendChild(this.queryContainer);
        this.tabPanels.data.appendChild(queryResultsResizer);
        this.tabPanels.data.appendChild(this.queryResultsContainer);

        // Mapping tab panel
        this.tabPanels.mapping = this.createElement('div', {
            className: 'gb-sidebar-panel gb-sidebar-panel--mapping',
            'data-panel': 'mapping'
        });
        this.dataMappingContainer = this.createElement('div', { className: 'gb-data-mapping-wrapper' });
        this.tabPanels.mapping.appendChild(this.dataMappingContainer);

        // Add panels to sidebar
        Object.values(this.tabPanels).forEach(panel => {
            sidebar.appendChild(panel);
        });

        // Show active tab
        this.updateTabVisibility();

        // Resizer between sidebar and content
        const sidebarResizer = this.createElement('div', { className: 'gb-sidebar-resizer' });
        this.sidebar = sidebar;
        this.initSidebarResizer(sidebarResizer);

        // Right column (preview)
        const content = this.createElement('div', { className: 'gb-content' });
        this.previewContainer = this.createElement('div', { className: 'gb-preview-wrapper' });
        content.appendChild(this.previewContainer);

        main.appendChild(sidebar);
        main.appendChild(sidebarResizer);
        main.appendChild(content);

        this.element.appendChild(header);
        this.element.appendChild(main);

        this.container.appendChild(this.element);
    }

    getTabIcon(iconName) {
        const icons = {
            settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>`,
            database: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>`,
            link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>`
        };
        return icons[iconName] || '';
    }

    switchTab(tabId) {
        if (this.activeTab === tabId) return;

        this.activeTab = tabId;
        this.updateTabVisibility();
        this.saveActiveTab();
    }

    updateTabVisibility() {
        // Update tab buttons
        Object.entries(this.tabButtons).forEach(([id, btn]) => {
            btn.classList.toggle('gb-sidebar-tab--active', id === this.activeTab);
        });

        // Update panels
        Object.entries(this.tabPanels).forEach(([id, panel]) => {
            panel.classList.toggle('gb-sidebar-panel--active', id === this.activeTab);
        });
    }

    saveActiveTab() {
        try {
            localStorage.setItem('graphBuilder_activeTab', this.activeTab);
        } catch (e) {
            // Ignore storage errors
        }
    }

    restoreActiveTab() {
        try {
            const saved = localStorage.getItem('graphBuilder_activeTab');
            if (saved && SIDEBAR_TABS.some(t => t.id === saved)) {
                this.activeTab = saved;
                this.updateTabVisibility();
            }
        } catch (e) {
            // Ignore storage errors
        }
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

        // Data importer
        this.dataImporter = new DataImporter(this.dataImporterContainer);
        this.dataImporter.init();

        // Data explorer
        this.dataExplorer = new DataExplorer(this.dataExplorerContainer, {
            apiBase: this.options.apiBase || '',
            onFieldClick: (fieldName, tableName) => {
                // Insert field name into query
                this.queryEditor.insertText(fieldName);
            },
            onTableSelect: (tableName, fields) => {
                // Query is auto-generated by DataExplorer
            }
        });
        this.dataExplorer.setQueryEditor(this.queryEditor);
        this.dataExplorer.init();

        // Query results table
        this.queryResults = new QueryResults(this.queryResultsContainer);
        this.queryResults.init();

        // Data mapping (column selection for chart axes)
        this.dataMapping = new DataMapping(this.dataMappingContainer);
        this.dataMapping.init();

        // Config panel
        this.configPanel = new ConfigPanel(this.configContainer);
        this.configPanel.init();

        // Preview panel
        this.previewPanel = new PreviewPanel(this.previewContainer);
        this.previewPanel.init();

        // Save dialog (appended to body for proper modal positioning)
        this.saveDialog = new SaveGraphDialog(document.body);
        this.saveDialog.init();
    }

    /**
     * Show the save graph dialog
     */
    showSaveDialog() {
        if (this.saveDialog) {
            this.saveDialog.open(this.editingGraph || null);
        }
    }

    /**
     * Load a saved graph configuration for editing
     * @param {number} graphId The graph ID to load
     */
    async loadSavedGraph(graphId) {
        try {
            const result = await apiClient.getGraph(graphId);

            if (!result.success || !result.data) {
                console.error('Failed to load graph:', result.error);
                return;
            }

            const graph = result.data;

            // Store the editing graph info for later use (save dialog, header display)
            this.editingGraph = {
                id: graph.id,
                name: graph.name,
                slug: graph.slug,
                description: graph.description
            };

            // Update header to show we're editing
            this.updateHeaderForEditing(graph.name);

            // Set chart type
            stateManager.setChartType(graph.chartType);

            // Set query in editor
            if (graph.dataSource && graph.dataSource.query) {
                stateManager.setQuery(graph.dataSource.query);
                if (this.queryEditor) {
                    this.queryEditor.setQuery(graph.dataSource.query);
                }
            }

            // Set config (base and type-specific)
            if (graph.configBase) {
                stateManager.setBaseConfig(graph.configBase);
            }

            if (graph.configType) {
                stateManager.setTypeConfig(graph.chartType, graph.configType);
            }

            // Set data mapping
            if (graph.dataMapping) {
                stateManager.setDataMapping(graph.dataMapping);
            }

            // Execute the query to load data
            if (graph.dataSource && graph.dataSource.query && this.queryEditor) {
                // Small delay to let UI update first
                setTimeout(() => {
                    this.queryEditor.execute();
                }, 100);
            }

            // Switch to data tab to show the loaded query
            this.switchTab('data');

        } catch (error) {
            console.error('Error loading saved graph:', error);
        }
    }

    /**
     * Update header to show editing mode with graph name
     * @param {string} graphName The name of the graph being edited
     */
    updateHeaderForEditing(graphName) {
        const logo = this.element.querySelector('.gb-logo');
        if (logo) {
            logo.innerHTML = `Graph Builder <span class="gb-editing-indicator">Editing: ${graphName}</span>`;
        }
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

    /**
     * Initialize the resizer between sidebar and content
     */
    initSidebarResizer(resizer) {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        const onMouseDown = (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = this.sidebar.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            resizer.classList.add('gb-sidebar-resizer--active');
        };

        const onMouseMove = (e) => {
            if (!isResizing) return;

            const deltaX = e.clientX - startX;
            const minWidth = 280;
            const maxWidth = 600;

            let newWidth = startWidth + deltaX;
            newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

            this.sidebar.style.width = `${newWidth}px`;

            // Trigger resize on preview panel
            if (this.previewPanel) {
                this.previewPanel.resize();
            }
        };

        const onMouseUp = () => {
            if (!isResizing) return;
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            resizer.classList.remove('gb-sidebar-resizer--active');

            // Save width to localStorage
            try {
                localStorage.setItem('graphBuilder_sidebarWidth', this.sidebar.style.width);
            } catch (e) {
                // Ignore
            }
        };

        resizer.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Store for cleanup
        this.eventBindings.push(
            { element: resizer, event: 'mousedown', handler: onMouseDown },
            { element: document, event: 'mousemove', handler: onMouseMove },
            { element: document, event: 'mouseup', handler: onMouseUp }
        );

        // Restore saved width
        try {
            const savedWidth = localStorage.getItem('graphBuilder_sidebarWidth');
            if (savedWidth) {
                this.sidebar.style.width = savedWidth;
            }
        } catch (e) {
            // Ignore
        }
    }

    /**
     * Initialize the resizer between data explorer and query editor
     */
    initDataResizer(resizer) {
        let isResizing = false;
        let startY = 0;
        let startTopHeight = 0;

        const onMouseDown = (e) => {
            isResizing = true;
            startY = e.clientY;
            startTopHeight = this.dataExplorerContainer.offsetHeight;
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
            resizer.classList.add('gb-data-resizer--active');
        };

        const onMouseMove = (e) => {
            if (!isResizing) return;

            const deltaY = e.clientY - startY;
            const parentHeight = this.tabPanels.data.offsetHeight;
            const resizerHeight = resizer.offsetHeight;
            const minHeight = 100; // Minimum height for each section

            let newTopHeight = startTopHeight + deltaY;

            // Constrain heights
            newTopHeight = Math.max(minHeight, newTopHeight);
            newTopHeight = Math.min(parentHeight - resizerHeight - minHeight, newTopHeight);

            // Calculate flex basis percentages
            const topPercent = (newTopHeight / parentHeight) * 100;

            this.dataExplorerContainer.style.flex = `0 0 ${topPercent}%`;
            this.queryContainer.style.flex = '1 1 auto';
        };

        const onMouseUp = () => {
            if (!isResizing) return;
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            resizer.classList.remove('gb-data-resizer--active');
        };

        resizer.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Store for cleanup
        this.eventBindings.push(
            { element: resizer, event: 'mousedown', handler: onMouseDown },
            { element: document, event: 'mousemove', handler: onMouseMove },
            { element: document, event: 'mouseup', handler: onMouseUp }
        );
    }

    /**
     * Initialize the resizer between query editor and results
     */
    initQueryResultsResizer(resizer) {
        let isResizing = false;
        let startY = 0;
        let startQueryHeight = 0;

        const onMouseDown = (e) => {
            isResizing = true;
            startY = e.clientY;
            startQueryHeight = this.queryContainer.offsetHeight;
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
            resizer.classList.add('gb-data-resizer--active');
        };

        const onMouseMove = (e) => {
            if (!isResizing) return;

            const deltaY = e.clientY - startY;
            const minHeight = 80; // Minimum height for each section

            let newQueryHeight = startQueryHeight + deltaY;

            // Constrain heights
            newQueryHeight = Math.max(minHeight, newQueryHeight);

            this.queryContainer.style.flex = `0 0 ${newQueryHeight}px`;
            this.queryResultsContainer.style.flex = '1 1 auto';
        };

        const onMouseUp = () => {
            if (!isResizing) return;
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            resizer.classList.remove('gb-data-resizer--active');

            // Save height to localStorage
            try {
                localStorage.setItem('graphBuilder_queryHeight', this.queryContainer.style.flex);
            } catch (e) {
                // Ignore
            }
        };

        resizer.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Store for cleanup
        this.eventBindings.push(
            { element: resizer, event: 'mousedown', handler: onMouseDown },
            { element: document, event: 'mousemove', handler: onMouseMove },
            { element: document, event: 'mouseup', handler: onMouseUp }
        );

        // Restore saved height
        try {
            const savedHeight = localStorage.getItem('graphBuilder_queryHeight');
            if (savedHeight) {
                this.queryContainer.style.flex = savedHeight;
                this.queryResultsContainer.style.flex = '1 1 auto';
            }
        } catch (e) {
            // Ignore
        }
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
        if (this.dataMapping) {
            this.dataMapping.destroy();
            this.dataMapping = null;
        }
        if (this.dataImporter) {
            this.dataImporter.destroy();
            this.dataImporter = null;
        }
        if (this.queryEditor) {
            this.queryEditor.destroy();
            this.queryEditor = null;
        }
        if (this.queryResults) {
            this.queryResults.destroy();
            this.queryResults = null;
        }
        if (this.previewPanel) {
            this.previewPanel.destroy();
            this.previewPanel = null;
        }
        if (this.themeSwitcher) {
            this.themeSwitcher.destroy();
            this.themeSwitcher = null;
        }
        if (this.saveDialog) {
            this.saveDialog.destroy();
            this.saveDialog = null;
        }
        super.destroy();
    }
}

export { GraphBuilder };
