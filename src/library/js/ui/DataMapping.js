import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { EVENTS, CHART_TYPES } from '../utils/constants.js';
import { createSelect, createFormSection } from './FormControls.js';

/**
 * DataMapping - Column selection for chart axes/data fields
 */
class DataMapping extends BaseComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.controls = {};
        this.columns = [];
    }

    init() {
        super.init();
        this.on(EVENTS.QUERY_EXECUTED, this.onDataLoaded.bind(this));
        this.on(EVENTS.CHART_TYPE_CHANGED, this.onChartTypeChanged.bind(this));
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-data-mapping' });

        // Header
        const header = this.createElement('div', { className: 'gb-data-mapping-header' }, 'Data Mapping');
        this.element.appendChild(header);

        // Content container
        this.contentEl = this.createElement('div', { className: 'gb-data-mapping-content' });
        this.element.appendChild(this.contentEl);

        // Initial render based on current state
        this.columns = stateManager.getColumns();
        this.renderControls();

        this.container.appendChild(this.element);
    }

    renderControls() {
        this.contentEl.innerHTML = '';
        this.controls = {};

        if (this.columns.length === 0) {
            const hint = this.createElement('div', { className: 'gb-data-mapping-hint' },
                'Execute a query to map columns to chart axes');
            this.contentEl.appendChild(hint);
            return;
        }

        const chartType = stateManager.getChartType();
        const mapping = stateManager.getDataMapping();

        if (chartType === CHART_TYPES.PIE) {
            this.renderPieMapping(mapping);
        } else {
            this.renderAxisMapping(mapping);
        }
    }

    renderAxisMapping(mapping) {
        const columnOptions = this.columns.map(col => ({ value: col, label: col }));

        // X-Axis selector
        this.controls.xAxis = createSelect({
            name: 'xAxis',
            label: 'X-Axis (Category)',
            value: mapping.xAxis || this.columns[0] || '',
            selectOptions: [{ value: '', label: '-- Select Column --' }, ...columnOptions],
            onChange: (value) => {
                this.updateMapping({ xAxis: value });
                // Re-render to update Y-axis options (exclude newly selected X-axis)
                this.renderControls();
            }
        });

        // Y-Axis multi-select (checkboxes)
        const yAxisContainer = this.createElement('div', { className: 'gb-form-group' });

        // Label with select/deselect buttons
        const yAxisHeader = this.createElement('div', { className: 'gb-form-label-row' });
        const yAxisLabel = this.createElement('label', { className: 'gb-form-label' }, 'Y-Axis (Values)');

        const toggleBtns = this.createElement('div', { className: 'gb-toggle-btns' });
        const selectAllBtn = this.createElement('button', {
            className: 'gb-toggle-btn',
            type: 'button',
            title: 'Select all'
        }, 'All');
        const deselectAllBtn = this.createElement('button', {
            className: 'gb-toggle-btn',
            type: 'button',
            title: 'Deselect all'
        }, 'None');

        selectAllBtn.addEventListener('click', () => this.selectAllYAxis(true));
        deselectAllBtn.addEventListener('click', () => this.selectAllYAxis(false));

        toggleBtns.appendChild(selectAllBtn);
        toggleBtns.appendChild(deselectAllBtn);

        yAxisHeader.appendChild(yAxisLabel);
        yAxisHeader.appendChild(toggleBtns);
        yAxisContainer.appendChild(yAxisHeader);

        const yAxisList = this.createElement('div', { className: 'gb-yaxis-list' });

        // Filter out the x-axis column from y-axis options
        const yColumns = this.columns.filter(col => col !== mapping.xAxis);
        const currentYAxis = mapping.yAxis || [];

        yColumns.forEach(col => {
            const checkbox = this.createElement('label', { className: 'gb-yaxis-item' });
            const input = this.createElement('input', {
                type: 'checkbox',
                value: col,
                checked: currentYAxis.includes(col) ? 'checked' : null
            });

            input.addEventListener('change', () => this.onYAxisChange());

            const span = this.createElement('span', {}, col);
            checkbox.appendChild(input);
            checkbox.appendChild(span);
            yAxisList.appendChild(checkbox);
        });

        this.yAxisList = yAxisList;
        yAxisContainer.appendChild(yAxisList);

        const section = createFormSection('Axis Mapping', [
            this.controls.xAxis,
            yAxisContainer
        ]);

        this.contentEl.appendChild(section);
    }

    selectAllYAxis(selectAll) {
        if (!this.yAxisList) return;

        const checkboxes = this.yAxisList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = selectAll;
        });

        this.onYAxisChange();
    }

    renderPieMapping(mapping) {
        const columnOptions = this.columns.map(col => ({ value: col, label: col }));

        // Name field selector
        this.controls.nameField = createSelect({
            name: 'nameField',
            label: 'Name Field (Labels)',
            value: mapping.nameField || this.columns[0] || '',
            selectOptions: [{ value: '', label: '-- Select Column --' }, ...columnOptions],
            onChange: (value) => this.updateMapping({ nameField: value })
        });

        // Value field selector
        this.controls.valueField = createSelect({
            name: 'valueField',
            label: 'Value Field (Numbers)',
            value: mapping.valueField || this.columns[1] || '',
            selectOptions: [{ value: '', label: '-- Select Column --' }, ...columnOptions],
            onChange: (value) => this.updateMapping({ valueField: value })
        });

        const section = createFormSection('Data Fields', [
            this.controls.nameField,
            this.controls.valueField
        ]);

        this.contentEl.appendChild(section);
    }

    onYAxisChange() {
        const checkboxes = this.yAxisList.querySelectorAll('input[type="checkbox"]:checked');
        const yAxis = Array.from(checkboxes).map(cb => cb.value);
        this.updateMapping({ yAxis });
    }

    updateMapping(partial) {
        stateManager.setDataMapping(partial);
    }

    onDataLoaded({ columns }) {
        this.columns = columns || [];
        // Auto-set mapping for new data
        if (this.columns.length > 0) {
            const mapping = stateManager.getDataMapping();
            if (!mapping.xAxis || !this.columns.includes(mapping.xAxis)) {
                stateManager.autoSetDataMapping(this.columns);
            }
        }
        this.renderControls();
    }

    onChartTypeChanged() {
        // When switching chart types, re-auto-set mapping if columns exist
        // This ensures proper xAxis/yAxis or nameField/valueField based on chart type
        if (this.columns.length > 0) {
            stateManager.autoSetDataMapping(this.columns);
        }
        this.renderControls();
    }

    getMapping() {
        return stateManager.getDataMapping();
    }
}

export { DataMapping };
