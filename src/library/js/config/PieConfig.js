import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { EVENTS, CHART_TYPES } from '../utils/constants.js';
import {
    createCheckbox,
    createSelect,
    createRange,
    createFormSection
} from '../ui/FormControls.js';

/**
 * PieConfig - Pie/Donut chart configuration with inner radius, border radius, and pad angle
 */
class PieConfig extends BaseComponent {
    constructor(container) {
        super(container);
        this.controls = {};
        this.chartType = CHART_TYPES.PIE;
    }

    init() {
        super.init();
        this.on(EVENTS.STATE_CHANGED, this.onStateChange.bind(this));
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-type-config gb-pie-config' });

        const config = stateManager.getTypeConfig(this.chartType);

        // Size section
        this.controls.radius = createRange({
            name: 'radius',
            label: 'Outer Radius %',
            value: config.radius || 70,
            min: 20,
            max: 100,
            step: 5,
            onChange: (value) => this.updateConfig({ radius: value })
        });

        this.controls.innerRadius = createRange({
            name: 'innerRadius',
            label: 'Inner Radius % (Donut)',
            value: config.innerRadius || 0,
            min: 0,
            max: 80,
            step: 5,
            onChange: (value) => this.updateConfig({ innerRadius: value })
        });

        const sizeSection = createFormSection('Size', [
            this.controls.radius,
            this.controls.innerRadius
        ]);

        // Style section
        this.controls.borderRadius = createRange({
            name: 'borderRadius',
            label: 'Border Radius',
            value: config.borderRadius || 0,
            min: 0,
            max: 20,
            step: 1,
            onChange: (value) => this.updateConfig({ borderRadius: value })
        });

        this.controls.padAngle = createRange({
            name: 'padAngle',
            label: 'Pad Angle',
            value: config.padAngle || 0,
            min: 0,
            max: 10,
            step: 0.5,
            onChange: (value) => this.updateConfig({ padAngle: value })
        });

        this.controls.roseType = createSelect({
            name: 'roseType',
            label: 'Rose Type',
            value: config.roseType || 'none',
            selectOptions: [
                { value: 'none', label: 'None' },
                { value: 'radius', label: 'Radius' },
                { value: 'area', label: 'Area' }
            ],
            onChange: (value) => this.updateConfig({ roseType: value })
        });

        const styleSection = createFormSection('Style', [
            this.controls.borderRadius,
            this.controls.padAngle,
            this.controls.roseType
        ]);

        // Labels section
        this.controls.showLabels = createCheckbox({
            name: 'showLabels',
            label: 'Show Labels',
            checked: config.showLabels !== false,
            onChange: (value) => this.updateConfig({ showLabels: value })
        });

        this.controls.showPercentage = createCheckbox({
            name: 'showPercentage',
            label: 'Show Percentage',
            checked: config.showPercentage !== false,
            onChange: (value) => this.updateConfig({ showPercentage: value })
        });

        this.controls.labelPosition = createSelect({
            name: 'labelPosition',
            label: 'Label Position',
            value: config.labelPosition || 'outside',
            selectOptions: [
                { value: 'outside', label: 'Outside' },
                { value: 'inside', label: 'Inside' },
                { value: 'center', label: 'Center' }
            ],
            onChange: (value) => this.updateConfig({ labelPosition: value })
        });

        const labelSection = createFormSection('Labels', [
            this.controls.showLabels,
            this.controls.showPercentage,
            this.controls.labelPosition
        ]);

        this.element.appendChild(sizeSection);
        this.element.appendChild(styleSection);
        this.element.appendChild(labelSection);

        this.container.appendChild(this.element);
    }

    updateConfig(partial) {
        stateManager.setTypeConfig(this.chartType, partial);
    }

    onStateChange() {
        const config = stateManager.getTypeConfig(this.chartType);
        this.setValues(config);
    }

    getValues() {
        return {
            radius: this.controls.radius?.getValue() || 70,
            innerRadius: this.controls.innerRadius?.getValue() || 0,
            borderRadius: this.controls.borderRadius?.getValue() || 0,
            padAngle: this.controls.padAngle?.getValue() || 0,
            roseType: this.controls.roseType?.getValue() || 'none',
            showLabels: this.controls.showLabels?.getValue() ?? true,
            showPercentage: this.controls.showPercentage?.getValue() ?? true,
            labelPosition: this.controls.labelPosition?.getValue() || 'outside'
        };
    }

    setValues(config) {
        if (this.controls.radius) this.controls.radius.setValue(config.radius || 70);
        if (this.controls.innerRadius) this.controls.innerRadius.setValue(config.innerRadius || 0);
        if (this.controls.borderRadius) this.controls.borderRadius.setValue(config.borderRadius || 0);
        if (this.controls.padAngle) this.controls.padAngle.setValue(config.padAngle || 0);
        if (this.controls.roseType) this.controls.roseType.setValue(config.roseType || 'none');
        if (this.controls.showLabels) this.controls.showLabels.setValue(config.showLabels !== false);
        if (this.controls.showPercentage) this.controls.showPercentage.setValue(config.showPercentage !== false);
        if (this.controls.labelPosition) this.controls.labelPosition.setValue(config.labelPosition || 'outside');
    }
}

export { PieConfig };
