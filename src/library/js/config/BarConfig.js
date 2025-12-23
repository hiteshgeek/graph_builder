import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { EVENTS, CHART_TYPES } from '../utils/constants.js';
import {
    createCheckbox,
    createRange,
    createTextInput,
    createFormSection
} from '../ui/FormControls.js';

/**
 * BarConfig - Bar chart specific configuration
 */
class BarConfig extends BaseComponent {
    constructor(container) {
        super(container);
        this.controls = {};
    }

    init() {
        super.init();
        this.on(EVENTS.STATE_CHANGED, this.onStateChange.bind(this));
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-type-config gb-bar-config' });

        const config = stateManager.getTypeConfig(CHART_TYPES.BAR);

        // Layout section
        this.controls.horizontal = createCheckbox({
            name: 'horizontal',
            label: 'Horizontal Bars',
            checked: config.horizontal || false,
            onChange: (value) => this.updateConfig({ horizontal: value })
        });

        this.controls.stacked = createCheckbox({
            name: 'stacked',
            label: 'Stacked',
            checked: config.stacked || false,
            onChange: (value) => this.updateConfig({ stacked: value })
        });

        const layoutSection = createFormSection('Layout', [
            this.controls.horizontal,
            this.controls.stacked
        ]);

        // Bar style section
        this.controls.barWidth = createRange({
            name: 'barWidth',
            label: 'Bar Width %',
            value: config.barWidth || 60,
            min: 10,
            max: 100,
            step: 5,
            onChange: (value) => this.updateConfig({ barWidth: value })
        });

        this.controls.barGap = createRange({
            name: 'barGap',
            label: 'Bar Gap %',
            value: config.barGap || 30,
            min: 0,
            max: 100,
            step: 5,
            onChange: (value) => this.updateConfig({ barGap: value })
        });

        this.controls.borderRadius = createRange({
            name: 'borderRadius',
            label: 'Border Radius',
            value: config.borderRadius || 0,
            min: 0,
            max: 20,
            step: 1,
            onChange: (value) => this.updateConfig({ borderRadius: value })
        });

        const styleSection = createFormSection('Bar Style', [
            this.controls.barWidth,
            this.controls.barGap,
            this.controls.borderRadius
        ]);

        // Axis Labels section
        this.controls.xAxisLabel = createTextInput({
            name: 'xAxisLabel',
            label: 'X-Axis Label',
            value: config.xAxisLabel || '',
            placeholder: 'e.g., Categories',
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

        this.element.appendChild(layoutSection);
        this.element.appendChild(styleSection);
        this.element.appendChild(axisSection);

        this.container.appendChild(this.element);
    }

    updateConfig(partial) {
        stateManager.setTypeConfig(CHART_TYPES.BAR, partial);
    }

    onStateChange() {
        const config = stateManager.getTypeConfig(CHART_TYPES.BAR);
        this.setValues(config);
    }

    getValues() {
        return {
            horizontal: this.controls.horizontal?.getValue() || false,
            stacked: this.controls.stacked?.getValue() || false,
            barWidth: this.controls.barWidth?.getValue() || 60,
            barGap: this.controls.barGap?.getValue() || 30,
            borderRadius: this.controls.borderRadius?.getValue() || 0,
            xAxisLabel: this.controls.xAxisLabel?.getValue() || '',
            yAxisLabel: this.controls.yAxisLabel?.getValue() || ''
        };
    }

    setValues(config) {
        if (this.controls.horizontal) this.controls.horizontal.setValue(config.horizontal || false);
        if (this.controls.stacked) this.controls.stacked.setValue(config.stacked || false);
        if (this.controls.barWidth) this.controls.barWidth.setValue(config.barWidth || 60);
        if (this.controls.barGap) this.controls.barGap.setValue(config.barGap || 30);
        if (this.controls.borderRadius) this.controls.borderRadius.setValue(config.borderRadius || 0);
        if (this.controls.xAxisLabel) this.controls.xAxisLabel.setValue(config.xAxisLabel || '');
        if (this.controls.yAxisLabel) this.controls.yAxisLabel.setValue(config.yAxisLabel || '');
    }
}

export { BarConfig };
