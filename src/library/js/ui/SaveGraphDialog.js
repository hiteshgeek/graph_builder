import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { apiClient } from '../data/ApiClient.js';

/**
 * SaveGraphDialog - Modal dialog for saving graph configurations
 */
class SaveGraphDialog extends BaseComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.isOpen = false;
        this.isLoading = false;
        this.editingGraph = null; // Stores info about graph being edited
    }

    init() {
        this.render();
        this.initialized = true;
    }

    render() {
        // Create backdrop
        this.backdrop = this.createElement('div', { className: 'gb-save-dialog-backdrop' });
        this.bindEvent(this.backdrop, 'click', (e) => {
            if (e.target === this.backdrop) {
                this.close();
            }
        });

        // Create dialog
        this.dialog = this.createElement('div', { className: 'gb-save-dialog' });

        // Header
        const header = this.createElement('div', { className: 'gb-save-dialog-header' });
        this.dialogTitle = this.createElement('h2', { className: 'gb-save-dialog-title' }, 'Save Graph');
        const closeBtn = this.createElement('button', {
            className: 'gb-save-dialog-close',
            type: 'button',
            'aria-label': 'Close'
        });
        closeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M18 6L6 18M6 6l12 12"/>
        </svg>`;
        this.bindEvent(closeBtn, 'click', () => this.close());
        header.appendChild(this.dialogTitle);
        header.appendChild(closeBtn);

        // Body
        const body = this.createElement('div', { className: 'gb-save-dialog-body' });

        // Name field
        const nameGroup = this.createElement('div', { className: 'gb-save-dialog-field' });
        const nameLabel = this.createElement('label', { for: 'save-graph-name' }, 'Name *');
        this.nameInput = this.createElement('input', {
            type: 'text',
            id: 'save-graph-name',
            placeholder: 'Enter graph name',
            required: true
        });
        this.bindEvent(this.nameInput, 'input', () => this.updateSlug());
        nameGroup.appendChild(nameLabel);
        nameGroup.appendChild(this.nameInput);

        // Slug field
        const slugGroup = this.createElement('div', { className: 'gb-save-dialog-field' });
        const slugLabel = this.createElement('label', { for: 'save-graph-slug' }, 'Slug');
        const slugHelp = this.createElement('span', { className: 'gb-save-dialog-help' }, 'URL-friendly identifier (auto-generated)');
        this.slugInput = this.createElement('input', {
            type: 'text',
            id: 'save-graph-slug',
            placeholder: 'auto-generated-from-name'
        });
        slugGroup.appendChild(slugLabel);
        slugGroup.appendChild(slugHelp);
        slugGroup.appendChild(this.slugInput);

        // Description field
        const descGroup = this.createElement('div', { className: 'gb-save-dialog-field' });
        const descLabel = this.createElement('label', { for: 'save-graph-desc' }, 'Description');
        this.descInput = this.createElement('textarea', {
            id: 'save-graph-desc',
            placeholder: 'Optional description',
            rows: 3
        });
        descGroup.appendChild(descLabel);
        descGroup.appendChild(this.descInput);

        // Data source info
        const sourceInfo = this.createElement('div', { className: 'gb-save-dialog-source' });
        sourceInfo.innerHTML = `<span class="gb-save-dialog-source-label">Data Source:</span>
            <span class="gb-save-dialog-source-value" id="save-source-info">SQL Query</span>`;

        body.appendChild(nameGroup);
        body.appendChild(slugGroup);
        body.appendChild(descGroup);
        body.appendChild(sourceInfo);

        // Footer
        const footer = this.createElement('div', { className: 'gb-save-dialog-footer' });

        // Message area
        this.messageArea = this.createElement('div', { className: 'gb-save-dialog-message' });
        footer.appendChild(this.messageArea);

        // Buttons
        const buttons = this.createElement('div', { className: 'gb-save-dialog-buttons' });

        const cancelBtn = this.createElement('button', {
            className: 'gb-save-dialog-btn gb-save-dialog-btn--cancel',
            type: 'button'
        }, 'Cancel');
        this.bindEvent(cancelBtn, 'click', () => this.close());

        this.saveBtn = this.createElement('button', {
            className: 'gb-save-dialog-btn gb-save-dialog-btn--save',
            type: 'button'
        });
        this.saveBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
        </svg>
        Save Graph`;
        this.bindEvent(this.saveBtn, 'click', () => this.save());

        buttons.appendChild(cancelBtn);
        buttons.appendChild(this.saveBtn);
        footer.appendChild(buttons);

        // Assemble dialog
        this.dialog.appendChild(header);
        this.dialog.appendChild(body);
        this.dialog.appendChild(footer);
        this.backdrop.appendChild(this.dialog);

        // Add to container (hidden by default)
        this.container.appendChild(this.backdrop);

        // Handle escape key
        this.bindEvent(document, 'keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Generate slug from name
     */
    updateSlug() {
        const name = this.nameInput.value;
        if (!name) {
            this.slugInput.value = '';
            return;
        }

        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        this.slugInput.value = slug;
    }

    /**
     * Open the dialog
     * @param {Object|null} editingGraph - Graph info if editing existing graph
     */
    open(editingGraph = null) {
        // Store editing graph info
        this.editingGraph = editingGraph;

        // Update dialog title based on mode
        if (editingGraph) {
            this.dialogTitle.textContent = 'Update Graph';
            this.nameInput.value = editingGraph.name || '';
            this.slugInput.value = editingGraph.slug || '';
            this.descInput.value = editingGraph.description || '';
        } else {
            this.dialogTitle.textContent = 'Save Graph';
            this.nameInput.value = '';
            this.slugInput.value = '';
            this.descInput.value = '';
        }

        this.messageArea.textContent = '';
        this.messageArea.className = 'gb-save-dialog-message';

        // Update source info
        const state = stateManager.getState();
        const sourceInfo = this.backdrop.querySelector('#save-source-info');
        if (sourceInfo) {
            sourceInfo.textContent = 'SQL Query'; // For now, we only support SQL
        }

        // Show dialog
        this.backdrop.classList.add('gb-save-dialog-backdrop--open');
        this.isOpen = true;

        // Focus name input
        setTimeout(() => this.nameInput.focus(), 100);
    }

    /**
     * Close the dialog
     */
    close() {
        this.backdrop.classList.remove('gb-save-dialog-backdrop--open');
        this.isOpen = false;
    }

    /**
     * Show message
     */
    showMessage(message, type = 'info') {
        this.messageArea.textContent = message;
        this.messageArea.className = `gb-save-dialog-message gb-save-dialog-message--${type}`;
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        this.saveBtn.disabled = loading;
        this.saveBtn.innerHTML = loading
            ? `<span class="gb-save-dialog-spinner"></span> Saving...`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
            </svg>
            Save Graph`;
    }

    /**
     * Save the graph configuration
     */
    async save() {
        if (this.isLoading) return;

        const name = this.nameInput.value.trim();
        if (!name) {
            this.showMessage('Please enter a name for the graph', 'error');
            this.nameInput.focus();
            return;
        }

        // Get current state
        const state = stateManager.getState();
        const chartType = state.chartType;
        const data = state.data;
        const mapping = state.dataMapping;
        const config = stateManager.getConfig();

        // Check if we have data (data is an array directly, not {rows: [...]})
        if (!data || !Array.isArray(data) || data.length === 0) {
            this.showMessage('No data available. Please execute a query first.', 'error');
            return;
        }

        // Get query from state
        const query = state.query || '';
        if (!query) {
            this.showMessage('No SQL query found. Please enter and execute a query.', 'error');
            return;
        }

        // Build the save payload
        const payload = {
            name: name,
            slug: this.slugInput.value.trim() || undefined,
            description: this.descInput.value.trim() || undefined,
            chartType: chartType,
            configBase: {
                title: config.base?.title || '',
                showLegend: config.base?.showLegend !== false,
                colors: config.base?.colors || [],
                animation: config.base?.animation !== false
            },
            configType: config[chartType] || {},
            dataMapping: {
                xAxis: mapping?.xAxis || '',
                yAxis: mapping?.yAxis || [],
                nameField: mapping?.nameField || '',
                valueField: mapping?.valueField || ''
            },
            dataSource: {
                type: 'sql',
                query: query
            }
        };

        // Include ID if updating existing graph
        if (this.editingGraph && this.editingGraph.id) {
            payload.id = this.editingGraph.id;
        }

        const isUpdating = !!payload.id;
        this.setLoading(true);
        this.showMessage(isUpdating ? 'Updating graph...' : 'Saving graph...', 'info');

        try {
            const result = await apiClient.saveGraph(payload);

            if (result.success) {
                this.showMessage(isUpdating ? 'Graph updated successfully!' : 'Graph saved successfully!', 'success');

                // Close dialog after a short delay
                setTimeout(() => {
                    this.close();
                }, 1500);
            } else {
                this.showMessage(result.error || 'Failed to save graph', 'error');
            }
        } catch (error) {
            console.error('Error saving graph:', error);
            this.showMessage('Error saving graph: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    destroy() {
        if (this.backdrop && this.backdrop.parentNode) {
            this.backdrop.parentNode.removeChild(this.backdrop);
        }
        super.destroy();
    }
}

export { SaveGraphDialog };
