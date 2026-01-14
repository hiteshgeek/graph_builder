import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { apiClient } from '../data/ApiClient.js';
import { TypeSwitcher } from './TypeSwitcher.js';
import { ConfigPanel } from './ConfigPanel.js';
import { DataExplorer } from './DataExplorer.js';
import { DataMapping } from './DataMapping.js';
import { DataSourceEditor } from './DataSourceEditor.js';
import { QueryResults } from './QueryResults.js';
import { PreviewPanel } from './PreviewPanel.js';
import { ThemeSwitcher } from './ThemeSwitcher.js';
import { SaveGraphDialog } from './SaveGraphDialog.js';
import { debounce } from '../utils/helpers.js';

// Main panel tab definitions (for right side)
const MAIN_TABS = [
    { id: 'config', label: 'Config', icon: 'settings' },
    { id: 'data', label: 'Data', icon: 'database' },
    { id: 'mapping', label: 'Mapping', icon: 'link' }
];

/**
 * GraphBuilder - Main orchestrator component
 * Layout: Left sidebar (Data Explorer) | Main area (Tabs + Graph Preview)
 */
class GraphBuilder extends BaseComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.typeSwitcher = null;
        this.configPanel = null;
        this.dataExplorer = null;
        this.dataMapping = null;
        this.dataSourceEditor = null;
        this.previewPanel = null;
        this.themeSwitcher = null;
        this.saveDialog = null;
        this.queryResults = null;
        this.activeTab = 'config';
        this.leftSidebarCollapsed = false;
        this.previewCollapsed = false;
    }

    init() {
        this.render();
        this.initComponents();
        this.setupResizeHandler();
        this.restoreActiveTab();
        this.restoreCollapsedStates();
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

        // Graphs dropdown (Save + Saved)
        const graphsDropdown = this.createHeaderDropdown({
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
            </svg>`,
            label: 'Graphs',
            items: [
                {
                    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                        <polyline points="17,21 17,13 7,13 7,21"/>
                        <polyline points="7,3 7,8 15,8"/>
                    </svg>`,
                    label: 'Save Graph',
                    action: () => this.showSaveDialog()
                },
                {
                    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                    </svg>`,
                    label: 'Saved Graphs',
                    href: 'graphs/'
                }
            ]
        });
        actions.appendChild(graphsDropdown);

        // Menu dropdown (Usage, Docs, Setup)
        const menuDropdown = this.createHeaderDropdown({
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="19" cy="12" r="1"/>
                <circle cx="5" cy="12" r="1"/>
            </svg>`,
            label: 'Menu',
            items: [
                {
                    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>`,
                    label: 'Usage Examples',
                    href: 'usage/'
                },
                {
                    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                    </svg>`,
                    label: 'Documentation',
                    href: 'docs/'
                },
                {
                    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>`,
                    label: 'Setup',
                    href: 'setup/'
                }
            ]
        });
        actions.appendChild(menuDropdown);

        header.appendChild(titleSection);
        header.appendChild(actions);

        // Main content - 3 column layout (left sidebar + tabbed center + preview)
        const main = this.createElement('div', { className: 'gb-main gb-main--three-column' });

        // ========================================
        // LEFT SIDEBAR - Data Explorer (collapsible)
        // ========================================
        this.leftSidebar = this.createElement('aside', { className: 'gb-left-sidebar' });

        // Left sidebar header with collapse toggle
        const leftSidebarHeader = this.createElement('div', { className: 'gb-left-sidebar-header' });
        const leftSidebarTitle = this.createElement('div', { className: 'gb-left-sidebar-title' });
        leftSidebarTitle.innerHTML = `${this.getDbIcon()}<span>Database Explorer</span>`;

        this.leftSidebarCollapseBtn = this.createElement('button', {
            className: 'gb-collapse-btn',
            type: 'button',
            title: 'Collapse sidebar'
        });
        this.leftSidebarCollapseBtn.innerHTML = this.getCollapseIcon();
        this.bindEvent(this.leftSidebarCollapseBtn, 'click', () => this.toggleLeftSidebar());

        leftSidebarHeader.appendChild(leftSidebarTitle);
        leftSidebarHeader.appendChild(this.leftSidebarCollapseBtn);

        // Left sidebar content
        const leftSidebarContent = this.createElement('div', { className: 'gb-left-sidebar-content' });

        // Data Explorer container
        this.dataExplorerContainer = this.createElement('div', { className: 'gb-data-explorer-wrapper' });

        leftSidebarContent.appendChild(this.dataExplorerContainer);

        this.leftSidebar.appendChild(leftSidebarHeader);
        this.leftSidebar.appendChild(leftSidebarContent);

        // Left sidebar resizer
        const leftSidebarResizer = this.createElement('div', { className: 'gb-left-sidebar-resizer' });

        // ========================================
        // CENTER - Tabbed panels (Config, Data, Mapping)
        // ========================================
        const centerPanel = this.createElement('div', { className: 'gb-center-panel' });

        // Tab navigation
        this.tabNav = this.createElement('div', { className: 'gb-center-tabs' });
        this.tabButtons = {};

        MAIN_TABS.forEach(tab => {
            const btn = this.createElement('button', {
                className: `gb-center-tab${tab.id === this.activeTab ? ' gb-center-tab--active' : ''}`,
                type: 'button',
                'data-tab': tab.id
            });

            const icon = this.createElement('span', { className: 'gb-center-tab-icon' });
            icon.innerHTML = this.getTabIcon(tab.icon);

            const label = this.createElement('span', { className: 'gb-center-tab-label' }, tab.label);

            btn.appendChild(icon);
            btn.appendChild(label);

            this.bindEvent(btn, 'click', () => this.switchTab(tab.id));

            this.tabButtons[tab.id] = btn;
            this.tabNav.appendChild(btn);
        });

        centerPanel.appendChild(this.tabNav);

        // Tab content panels
        this.tabPanels = {};

        // Config tab panel
        this.tabPanels.config = this.createElement('div', {
            className: 'gb-center-panel-content gb-center-panel-content--config',
            'data-panel': 'config'
        });
        this.configContainer = this.createElement('div', { className: 'gb-config-wrapper' });
        this.tabPanels.config.appendChild(this.configContainer);

        // Data tab panel (SQL query + results)
        this.tabPanels.data = this.createElement('div', {
            className: 'gb-center-panel-content gb-center-panel-content--data',
            'data-panel': 'data'
        });

        // Data Source Editor section
        this.queryContainer = this.createElement('div', { className: 'gb-query-wrapper' });
        this.dataSourceSection = this.createCollapsibleSection('datasource', 'SQL Query', this.queryContainer, this.getQueryIcon());

        // Query Results section
        this.queryResultsContainer = this.createElement('div', { className: 'gb-query-results-wrapper' });
        this.queryResultsSection = this.createCollapsibleSection('results', 'Query Results', this.queryResultsContainer, this.getResultsIcon());

        // Resizer between query and results
        const queryResultsResizer = this.createElement('div', { className: 'gb-data-resizer gb-query-results-resizer' });

        this.tabPanels.data.appendChild(this.dataSourceSection);
        this.tabPanels.data.appendChild(queryResultsResizer);
        this.tabPanels.data.appendChild(this.queryResultsSection);

        this.initQueryResultsResizer(queryResultsResizer);

        // Mapping tab panel
        this.tabPanels.mapping = this.createElement('div', {
            className: 'gb-center-panel-content gb-center-panel-content--mapping',
            'data-panel': 'mapping'
        });
        this.dataMappingContainer = this.createElement('div', { className: 'gb-data-mapping-wrapper' });
        this.tabPanels.mapping.appendChild(this.dataMappingContainer);

        // Add panels to center
        Object.values(this.tabPanels).forEach(panel => {
            centerPanel.appendChild(panel);
        });

        // Show active tab
        this.updateTabVisibility();

        // ========================================
        // RIGHT - Graph Preview (collapsible)
        // ========================================
        this.previewSection = this.createElement('div', { className: 'gb-preview-section' });

        // Preview header with collapse toggle
        const previewHeader = this.createElement('div', { className: 'gb-preview-header' });
        const previewTitle = this.createElement('div', { className: 'gb-preview-title' });
        previewTitle.innerHTML = `${this.getChartIcon()}<span>Graph Preview</span>`;

        this.previewCollapseBtn = this.createElement('button', {
            className: 'gb-collapse-btn',
            type: 'button',
            title: 'Collapse preview'
        });
        this.previewCollapseBtn.innerHTML = this.getCollapseIcon('right');
        this.bindEvent(this.previewCollapseBtn, 'click', () => this.togglePreview());

        previewHeader.appendChild(previewTitle);
        previewHeader.appendChild(this.previewCollapseBtn);

        // Preview content
        this.previewContainer = this.createElement('div', { className: 'gb-preview-wrapper' });

        this.previewSection.appendChild(previewHeader);
        this.previewSection.appendChild(this.previewContainer);

        // Preview resizer
        const previewResizer = this.createElement('div', { className: 'gb-preview-resizer' });

        // Expand button for left sidebar (shown when collapsed)
        this.leftExpandBtn = this.createElement('button', {
            className: 'gb-expand-btn gb-expand-btn--left',
            type: 'button',
            title: 'Show Database Explorer'
        });
        this.leftExpandBtn.innerHTML = `${this.getDbIcon()}`;
        this.bindEvent(this.leftExpandBtn, 'click', () => this.toggleLeftSidebar());

        // Expand button for preview (shown when collapsed)
        this.previewExpandBtn = this.createElement('button', {
            className: 'gb-expand-btn gb-expand-btn--right',
            type: 'button',
            title: 'Show Graph Preview'
        });
        this.previewExpandBtn.innerHTML = `${this.getChartIcon()}`;
        this.bindEvent(this.previewExpandBtn, 'click', () => this.togglePreview());

        // Assemble main layout
        main.appendChild(this.leftExpandBtn);
        main.appendChild(this.leftSidebar);
        main.appendChild(leftSidebarResizer);
        main.appendChild(centerPanel);
        main.appendChild(previewResizer);
        main.appendChild(this.previewSection);
        main.appendChild(this.previewExpandBtn);

        this.element.appendChild(header);
        this.element.appendChild(main);

        this.container.appendChild(this.element);

        // Initialize resizers
        this.initLeftSidebarResizer(leftSidebarResizer);
        this.initPreviewResizer(previewResizer);
    }

    /**
     * Toggle left sidebar collapse
     */
    toggleLeftSidebar() {
        this.leftSidebarCollapsed = !this.leftSidebarCollapsed;
        this.leftSidebar.classList.toggle('gb-left-sidebar--collapsed', this.leftSidebarCollapsed);
        this.leftExpandBtn.classList.toggle('gb-expand-btn--visible', this.leftSidebarCollapsed);
        this.leftSidebarCollapseBtn.innerHTML = this.leftSidebarCollapsed ? this.getExpandIcon() : this.getCollapseIcon();
        this.leftSidebarCollapseBtn.title = this.leftSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
        this.saveCollapsedState('leftSidebar', this.leftSidebarCollapsed);

        // Trigger preview resize
        setTimeout(() => {
            if (this.previewPanel) this.previewPanel.resize();
        }, 300);
    }

    /**
     * Toggle preview collapse
     */
    togglePreview() {
        this.previewCollapsed = !this.previewCollapsed;
        this.previewSection.classList.toggle('gb-preview-section--collapsed', this.previewCollapsed);
        this.previewExpandBtn.classList.toggle('gb-expand-btn--visible', this.previewCollapsed);
        this.previewCollapseBtn.innerHTML = this.previewCollapsed ? this.getExpandIcon('right') : this.getCollapseIcon('right');
        this.previewCollapseBtn.title = this.previewCollapsed ? 'Expand preview' : 'Collapse preview';
        this.saveCollapsedState('preview', this.previewCollapsed);

        // Trigger preview resize
        setTimeout(() => {
            if (this.previewPanel) this.previewPanel.resize();
        }, 300);
    }

    /**
     * Restore collapsed states from localStorage
     */
    restoreCollapsedStates() {
        if (this.isCollapsed('leftSidebar')) {
            this.leftSidebarCollapsed = true;
            this.leftSidebar.classList.add('gb-left-sidebar--collapsed');
            this.leftExpandBtn.classList.add('gb-expand-btn--visible');
            this.leftSidebarCollapseBtn.innerHTML = this.getExpandIcon();
            this.leftSidebarCollapseBtn.title = 'Expand sidebar';
        }

        if (this.isCollapsed('preview')) {
            this.previewCollapsed = true;
            this.previewSection.classList.add('gb-preview-section--collapsed');
            this.previewExpandBtn.classList.add('gb-expand-btn--visible');
            this.previewCollapseBtn.innerHTML = this.getExpandIcon('right');
            this.previewCollapseBtn.title = 'Expand preview';
        }
    }

    /**
     * Create a collapsible section with header and content
     */
    createCollapsibleSection(id, title, contentElement, iconHtml = '', actionsElement = null) {
        const section = this.createElement('div', {
            className: 'gb-collapsible-section',
            'data-section': id
        });

        // Header
        const header = this.createElement('div', { className: 'gb-collapsible-header' });

        const headerLeft = this.createElement('div', { className: 'gb-collapsible-header-left' });

        // Chevron icon
        const chevronIcon = this.createElement('span', { className: 'gb-collapsible-header-icon' });
        chevronIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
        </svg>`;

        headerLeft.appendChild(chevronIcon);

        // Section icon (optional)
        if (iconHtml) {
            const sectionIcon = this.createElement('span', { className: 'gb-collapsible-header-section-icon' });
            sectionIcon.innerHTML = iconHtml;
            headerLeft.appendChild(sectionIcon);
        }

        const titleEl = this.createElement('span', { className: 'gb-collapsible-header-title' }, title);
        headerLeft.appendChild(titleEl);

        header.appendChild(headerLeft);

        // Actions element (optional)
        if (actionsElement) {
            const headerActions = this.createElement('div', { className: 'gb-collapsible-header-actions' });
            headerActions.appendChild(actionsElement);
            header.appendChild(headerActions);
            this.bindEvent(headerActions, 'click', (e) => e.stopPropagation());
        }

        // Content wrapper
        const content = this.createElement('div', { className: 'gb-collapsible-content' });
        content.appendChild(contentElement);

        section.appendChild(header);
        section.appendChild(content);

        // Toggle collapse on header click
        this.bindEvent(header, 'click', () => {
            const isCollapsed = section.classList.toggle('gb-collapsible-section--collapsed');
            this.saveCollapsedState(id, isCollapsed);
        });

        // Restore collapsed state
        if (this.isCollapsed(id)) {
            section.classList.add('gb-collapsible-section--collapsed');
        }

        return section;
    }

    /**
     * Save collapsed state to localStorage
     */
    saveCollapsedState(sectionId, isCollapsed) {
        try {
            const key = 'graphBuilder_collapsed';
            const states = JSON.parse(localStorage.getItem(key) || '{}');
            states[sectionId] = isCollapsed;
            localStorage.setItem(key, JSON.stringify(states));
        } catch (e) {
            // Ignore storage errors
        }
    }

    /**
     * Check if a section is collapsed
     */
    isCollapsed(sectionId) {
        try {
            const key = 'graphBuilder_collapsed';
            const states = JSON.parse(localStorage.getItem(key) || '{}');
            return states[sectionId] === true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Expand a section if it's collapsed (for resizer interaction)
     */
    expandSectionForResize(sectionElement, sectionId) {
        if (sectionElement && sectionElement.classList.contains('gb-collapsible-section--collapsed')) {
            sectionElement.classList.remove('gb-collapsible-section--collapsed');
            this.saveCollapsedState(sectionId, false);
        }
    }

    // Icons
    getDbIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>`;
    }

    getQueryIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>`;
    }

    getResultsIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 21V9"/>
        </svg>`;
    }

    getChartIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>`;
    }

    getCollapseIcon(direction = 'left') {
        if (direction === 'right') {
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polyline points="9 18 15 12 9 6"/>
            </svg>`;
        }
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="15 18 9 12 15 6"/>
        </svg>`;
    }

    getExpandIcon(direction = 'left') {
        if (direction === 'right') {
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polyline points="15 18 9 12 15 6"/>
            </svg>`;
        }
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="9 18 15 12 9 6"/>
        </svg>`;
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

    createHeaderDropdown({ icon, label, items }) {
        const dropdown = this.createElement('div', { className: 'gb-header-dropdown' });

        const toggle = this.createElement('button', {
            className: 'gb-header-dropdown-toggle',
            type: 'button'
        });
        toggle.innerHTML = `${icon}<span class="gb-header-dropdown-label">${label}</span>
            <svg class="gb-header-dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M6 9l6 6 6-6"/>
            </svg>`;

        const menu = this.createElement('div', { className: 'gb-header-dropdown-menu' });

        items.forEach(item => {
            if (item.href) {
                const link = this.createElement('a', {
                    className: 'gb-header-dropdown-item',
                    href: item.href
                });
                link.innerHTML = `${item.icon}<span>${item.label}</span>`;
                menu.appendChild(link);
            } else if (item.action) {
                const btn = this.createElement('button', {
                    className: 'gb-header-dropdown-item',
                    type: 'button'
                });
                btn.innerHTML = `${item.icon}<span>${item.label}</span>`;
                this.bindEvent(btn, 'click', () => {
                    dropdown.classList.remove('gb-header-dropdown--open');
                    item.action();
                });
                menu.appendChild(btn);
            }
        });

        dropdown.appendChild(toggle);
        dropdown.appendChild(menu);

        this.bindEvent(toggle, 'click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.gb-header-dropdown--open').forEach(d => {
                if (d !== dropdown) d.classList.remove('gb-header-dropdown--open');
            });
            dropdown.classList.toggle('gb-header-dropdown--open');
        });

        this.bindEvent(document, 'click', () => {
            dropdown.classList.remove('gb-header-dropdown--open');
        });

        return dropdown;
    }

    switchTab(tabId) {
        if (this.activeTab === tabId) return;

        this.activeTab = tabId;
        this.updateTabVisibility();
        this.saveActiveTab();
    }

    updateTabVisibility() {
        Object.entries(this.tabButtons).forEach(([id, btn]) => {
            btn.classList.toggle('gb-center-tab--active', id === this.activeTab);
        });

        Object.entries(this.tabPanels).forEach(([id, panel]) => {
            panel.classList.toggle('gb-center-panel-content--active', id === this.activeTab);
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
            if (saved && MAIN_TABS.some(t => t.id === saved)) {
                this.activeTab = saved;
                this.updateTabVisibility();
            }
        } catch (e) {
            // Ignore storage errors
        }
    }

    initComponents() {
        // Theme switcher
        this.themeSwitcher = new ThemeSwitcher(this.themeSwitcherContainer);
        this.themeSwitcher.init();

        // Type switcher
        this.typeSwitcher = new TypeSwitcher(this.typeSwitcherContainer);
        this.typeSwitcher.init();

        // Data source editor (SQL only)
        this.dataSourceEditor = new DataSourceEditor(this.queryContainer, {
            apiBase: this.options.apiBase || ''
        });
        this.dataSourceEditor.init();

        // Data explorer
        this.dataExplorer = new DataExplorer(this.dataExplorerContainer, {
            apiBase: this.options.apiBase || '',
            onFieldClick: (fieldName, tableName) => {
                if (this.dataSourceEditor && this.dataSourceEditor.sqlTextarea) {
                    const textarea = this.dataSourceEditor.sqlTextarea;
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const value = textarea.value;
                    const needsSpaceBefore = start > 0 && !/\s/.test(value[start - 1]);
                    const insertText = (needsSpaceBefore ? ' ' : '') + fieldName;
                    textarea.value = value.substring(0, start) + insertText + value.substring(end);
                    textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
                    textarea.focus();
                    stateManager.setQuery(textarea.value);
                }
            },
            onTableSelect: (tableName, fields) => {
                // Query is auto-generated by DataExplorer
            }
        });
        this.dataExplorer.setQueryEditor(this.dataSourceEditor);
        this.dataExplorer.init();

        // Query results table
        this.queryResults = new QueryResults(this.queryResultsContainer);
        this.queryResults.init();

        // Data mapping
        this.dataMapping = new DataMapping(this.dataMappingContainer);
        this.dataMapping.init();

        // Config panel
        this.configPanel = new ConfigPanel(this.configContainer);
        this.configPanel.init();

        // Preview panel
        this.previewPanel = new PreviewPanel(this.previewContainer);
        this.previewPanel.init();

        // Save dialog
        this.saveDialog = new SaveGraphDialog(document.body);
        this.saveDialog.init();
    }

    showSaveDialog() {
        if (this.saveDialog) {
            this.saveDialog.open(this.editingGraph || null);
        }
    }

    async loadSavedGraph(graphId) {
        try {
            const result = await apiClient.getGraph(graphId);

            if (!result.success || !result.data) {
                console.error('Failed to load graph:', result.error);
                return;
            }

            const graph = result.data;

            this.editingGraph = {
                id: graph.id,
                name: graph.name,
                slug: graph.slug,
                description: graph.description
            };

            this.updateHeaderForEditing(graph.name);

            stateManager.setChartType(graph.chartType);

            if (graph.dataSource) {
                const dsConfig = {
                    type: graph.dataSource.type || 'sql',
                    query: graph.dataSource.query || ''
                };
                stateManager.setDataSourceConfig(dsConfig);
                stateManager.setQuery(dsConfig.query);

                if (this.dataSourceEditor) {
                    this.dataSourceEditor.setDataSourceConfig(dsConfig);
                }
            }

            if (graph.configBase) {
                stateManager.setBaseConfig(graph.configBase);
            }

            if (graph.configType) {
                stateManager.setTypeConfig(graph.chartType, graph.configType);
            }

            if (graph.dataMapping) {
                stateManager.setDataMapping(graph.dataMapping);
            }

            if (graph.dataSource && this.dataSourceEditor) {
                setTimeout(() => {
                    this.dataSourceEditor.execute();
                }, 100);
            }

            this.switchTab('data');

        } catch (error) {
            console.error('Error loading saved graph:', error);
        }
    }

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
     * Initialize the left sidebar resizer
     */
    initLeftSidebarResizer(resizer) {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        const onMouseDown = (e) => {
            if (this.leftSidebarCollapsed) return;
            isResizing = true;
            startX = e.clientX;
            startWidth = this.leftSidebar.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            resizer.classList.add('gb-left-sidebar-resizer--active');
        };

        const onMouseMove = (e) => {
            if (!isResizing) return;

            const deltaX = e.clientX - startX;
            const minWidth = 200;
            const maxWidth = 400;

            let newWidth = startWidth + deltaX;
            newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

            this.leftSidebar.style.width = `${newWidth}px`;

            if (this.previewPanel) {
                this.previewPanel.resize();
            }
        };

        const onMouseUp = () => {
            if (!isResizing) return;
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            resizer.classList.remove('gb-left-sidebar-resizer--active');

            try {
                localStorage.setItem('graphBuilder_leftSidebarWidth', this.leftSidebar.style.width);
            } catch (e) {
                // Ignore
            }
        };

        resizer.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        this.eventBindings.push(
            { element: resizer, event: 'mousedown', handler: onMouseDown },
            { element: document, event: 'mousemove', handler: onMouseMove },
            { element: document, event: 'mouseup', handler: onMouseUp }
        );

        // Restore saved width
        try {
            const savedWidth = localStorage.getItem('graphBuilder_leftSidebarWidth');
            if (savedWidth) {
                this.leftSidebar.style.width = savedWidth;
            }
        } catch (e) {
            // Ignore
        }
    }

    /**
     * Initialize the preview panel resizer
     */
    initPreviewResizer(resizer) {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        const onMouseDown = (e) => {
            if (this.previewCollapsed) return;
            isResizing = true;
            startX = e.clientX;
            startWidth = this.previewSection.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            resizer.classList.add('gb-preview-resizer--active');
        };

        const onMouseMove = (e) => {
            if (!isResizing) return;

            const deltaX = startX - e.clientX; // Reversed because dragging left increases width
            const minWidth = 300;
            const maxWidth = 800;

            let newWidth = startWidth + deltaX;
            newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

            this.previewSection.style.width = `${newWidth}px`;

            if (this.previewPanel) {
                this.previewPanel.resize();
            }
        };

        const onMouseUp = () => {
            if (!isResizing) return;
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            resizer.classList.remove('gb-preview-resizer--active');

            try {
                localStorage.setItem('graphBuilder_previewWidth', this.previewSection.style.width);
            } catch (e) {
                // Ignore
            }
        };

        resizer.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        this.eventBindings.push(
            { element: resizer, event: 'mousedown', handler: onMouseDown },
            { element: document, event: 'mousemove', handler: onMouseMove },
            { element: document, event: 'mouseup', handler: onMouseUp }
        );

        // Restore saved width
        try {
            const savedWidth = localStorage.getItem('graphBuilder_previewWidth');
            if (savedWidth) {
                this.previewSection.style.width = savedWidth;
            }
        } catch (e) {
            // Ignore
        }
    }

    /**
     * Initialize the resizer between query editor and results
     */
    initQueryResultsResizer(resizer) {
        let isResizing = false;
        let startY = 0;
        let startQueryHeight = 0;

        const onMouseDown = (e) => {
            this.expandSectionForResize(this.dataSourceSection, 'datasource');
            this.expandSectionForResize(this.queryResultsSection, 'results');

            isResizing = true;
            startY = e.clientY;
            startQueryHeight = this.dataSourceSection.offsetHeight;
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
            resizer.classList.add('gb-data-resizer--active');
        };

        const onMouseMove = (e) => {
            if (!isResizing) return;

            const deltaY = e.clientY - startY;
            const minHeight = 80;

            let newQueryHeight = startQueryHeight + deltaY;
            newQueryHeight = Math.max(minHeight, newQueryHeight);

            this.dataSourceSection.style.flex = `0 0 ${newQueryHeight}px`;
            this.queryResultsSection.style.flex = '1 1 auto';
        };

        const onMouseUp = () => {
            if (!isResizing) return;
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            resizer.classList.remove('gb-data-resizer--active');

            try {
                localStorage.setItem('graphBuilder_queryHeight', this.dataSourceSection.style.flex);
            } catch (e) {
                // Ignore
            }
        };

        resizer.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        this.eventBindings.push(
            { element: resizer, event: 'mousedown', handler: onMouseDown },
            { element: document, event: 'mousemove', handler: onMouseMove },
            { element: document, event: 'mouseup', handler: onMouseUp }
        );

        // Restore saved height
        try {
            const savedHeight = localStorage.getItem('graphBuilder_queryHeight');
            if (savedHeight) {
                this.dataSourceSection.style.flex = savedHeight;
                this.queryResultsSection.style.flex = '1 1 auto';
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
        if (this.dataSourceEditor) {
            this.dataSourceEditor.setQuery(sql);
        }
    }

    executeQuery() {
        if (this.dataSourceEditor) {
            this.dataSourceEditor.execute();
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
        if (this.dataSourceEditor) {
            this.dataSourceEditor.destroy();
            this.dataSourceEditor = null;
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
