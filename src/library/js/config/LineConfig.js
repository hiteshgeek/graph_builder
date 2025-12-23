import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { EVENTS, CHART_TYPES } from '../utils/constants.js';
import {
    createCheckbox,
    createSelect,
    createRange,
    createTextInput,
    createFormSection
} from '../ui/FormControls.js';

/**
 * LineConfig - Line chart specific configuration
 */
class LineConfig extends BaseComponent {
    constructor(container) {
        super(container);
        this.controls = {};
    }

    init() {
        super.init();
        this.on(EVENTS.STATE_CHANGED, this.onStateChange.bind(this));
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-type-config gb-line-config' });

        const config = stateManager.getTypeConfig(CHART_TYPES.LINE);

        // Line style section
        this.controls.smooth = createCheckbox({
            name: 'smooth',
            label: 'Smooth Curve',
            checked: config.smooth || false,
            onChange: (value) => this.updateConfig({ smooth: value })
        });

        this.controls.showArea = createCheckbox({
            name: 'showArea',
            label: 'Area Fill',
            checked: config.showArea || false,
            onChange: (value) => this.updateConfig({ showArea: value })
        });

        this.controls.lineWidth = createRange({
            name: 'lineWidth',
            label: 'Line Width',
            value: config.lineWidth || 2,
            min: 1,
            max: 10,
            step: 1,
            onChange: (value) => this.updateConfig({ lineWidth: value })
        });

        this.controls.stepLine = createSelect({
            name: 'stepLine',
            label: 'Step Line',
            value: config.stepLine || 'none',
            selectOptions: [
                { value: 'none', label: 'None' },
                { value: 'start', label: 'Start' },
                { value: 'middle', label: 'Middle' },
                { value: 'end', label: 'End' }
            ],
            onChange: (value) => this.updateConfig({ stepLine: value })
        });

        const lineSection = createFormSection('Line Style', [
            this.controls.smooth,
            this.controls.showArea,
            this.controls.lineWidth,
            this.controls.stepLine
        ]);

        // Points section
        this.controls.showSymbol = createCheckbox({
            name: 'showSymbol',
            label: 'Show Points',
            checked: config.showSymbol !== false,
            onChange: (value) => this.updateConfig({ showSymbol: value })
        });

        this.controls.symbolSize = createRange({
            name: 'symbolSize',
            label: 'Point Size',
            value: config.symbolSize || 6,
            min: 2,
            max: 20,
            step: 1,
            onChange: (value) => this.updateConfig({ symbolSize: value })
        });

        const pointsSection = createFormSection('Data Points', [
            this.controls.showSymbol,
            this.controls.symbolSize
        ]);

        // Axis Labels section
        this.controls.xAxisLabel = createTextInput({
            name: 'xAxisLabel',
            label: 'X-Axis Label',
            value: config.xAxisLabel || '',
            placeholder: 'e.g., Time',
            onChange: (value) => this.updateConfig({ xAxisLabel: value })
        });

        this.controls.yAxisLabel = createTextInput({
            name: 'yAxisLabel',
            label: 'Y-Axis Label',
            value: config.yAxisLabel || '',
            placeholder: 'e.g., Values',
            onChange: (value) => this.updateConfig({ yAxisLabel: value })
        });

        const axisSection = createFormSection('Axis Labels', [
            this.controls.xAxisLabel,
            this.controls.yAxisLabel
        ]);

        this.element.appendChild(lineSection);
        this.element.appendChild(pointsSection);
        this.element.appendChild(axisSection);

        this.container.appendChild(this.element);
    }

    updateConfig(partial) {
        stateManager.setTypeConfig(CHART_TYPES.LINE, partial);
    }

    onStateChange() {
        const config = stateManager.getTypeConfig(CHART_TYPES.LINE);
        this.setValues(config);
    }

    getValues() {
        return {
            smooth: this.controls.smooth?.getValue() || false,
            showArea: this.controls.showArea?.getValue() || false,
            showSymbol: this.controls.showSymbol?.getValue() ?? true,
            symbolSize: this.controls.symbolSize?.getValue() || 6,
            lineWidth: this.controls.lineWidth?.getValue() || 2,
            stepLine: this.controls.stepLine?.getValue() || 'none',
            xAxisLabel: this.controls.xAxisLabel?.getValue() || '',
            yAxisLabel: this.controls.yAxisLabel?.getValue() || ''
        };
    }

    setValues(config) {
        if (this.controls.smooth) this.controls.smooth.setValue(config.smooth || false);
        if (this.controls.showArea) this.controls.showArea.setValue(config.showArea || false);
        if (this.controls.showSymbol) this.controls.showSymbol.setValue(config.showSymbol !== false);
        if (this.controls.symbolSize) this.controls.symbolSize.setValue(config.symbolSize || 6);
        if (this.controls.lineWidth) this.controls.lineWidth.setValue(config.lineWidth || 2);
        if (this.controls.stepLine) this.controls.stepLine.setValue(config.stepLine || 'none');
        if (this.controls.xAxisLabel) this.controls.xAxisLabel.setValue(config.xAxisLabel || '');
        if (this.controls.yAxisLabel) this.controls.yAxisLabel.setValue(config.yAxisLabel || '');
    }
}

export { LineConfig };
