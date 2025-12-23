import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { EVENTS, DEFAULT_COLORS } from '../utils/constants.js';
import {
    createTextInput,
    createCheckbox,
    createSelect,
    createColorPalette,
    createFormSection
} from '../ui/FormControls.js';

/**
 * BaseConfig - Shared configuration options panel
 */
class BaseConfig extends BaseComponent {
    constructor(container) {
        super(container);
        this.controls = {};
    }

    init() {
        super.init();
        this.on(EVENTS.STATE_CHANGED, this.onStateChange.bind(this));
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-base-config' });

        const config = stateManager.getBaseConfig();

        // Title section
        this.controls.title = createTextInput({
            name: 'title',
            label: 'Chart Title',
            value: config.title || '',
            placeholder: 'Enter title...',
            onChange: (value) => this.updateConfig({ title: value })
        });

        this.controls.subtitle = createTextInput({
            name: 'subtitle',
            label: 'Subtitle',
            value: config.subtitle || '',
            placeholder: 'Enter subtitle...',
            onChange: (value) => this.updateConfig({ subtitle: value })
        });

        const titleSection = createFormSection('Title', [
            this.controls.title,
            this.controls.subtitle
        ]);

        // Legend section
        this.controls.showLegend = createCheckbox({
            name: 'showLegend',
            label: 'Show Legend',
            checked: config.showLegend !== false,
            onChange: (value) => this.updateConfig({ showLegend: value })
        });

        this.controls.legendPosition = createSelect({
            name: 'legendPosition',
            label: 'Legend Position',
            value: config.legendPosition || 'top',
            selectOptions: [
                { value: 'top', label: 'Top' },
                { value: 'bottom', label: 'Bottom' },
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' }
            ],
            onChange: (value) => this.updateConfig({ legendPosition: value })
        });

        const legendSection = createFormSection('Legend', [
            this.controls.showLegend,
            this.controls.legendPosition
        ]);

        // Colors section
        this.controls.colors = createColorPalette({
            name: 'colors',
            label: 'Color Palette',
            colors: config.colors || DEFAULT_COLORS,
            onChange: (value) => this.updateConfig({ colors: value })
        });

        const colorSection = createFormSection('Colors', [
            this.controls.colors
        ]);

        // Animation section
        this.controls.animation = createCheckbox({
            name: 'animation',
            label: 'Enable Animation',
            checked: config.animation !== false,
            onChange: (value) => this.updateConfig({ animation: value })
        });

        const animationSection = createFormSection('Animation', [
            this.controls.animation
        ]);

        this.element.appendChild(titleSection);
        this.element.appendChild(legendSection);
        this.element.appendChild(colorSection);
        this.element.appendChild(animationSection);

        this.container.appendChild(this.element);
    }

    updateConfig(partial) {
        stateManager.setBaseConfig(partial);
    }

    onStateChange() {
        const config = stateManager.getBaseConfig();
        this.setValues(config);
    }

    getValues() {
        return {
            title: this.controls.title?.getValue() || '',
            subtitle: this.controls.subtitle?.getValue() || '',
            showLegend: this.controls.showLegend?.getValue() ?? true,
            legendPosition: this.controls.legendPosition?.getValue() || 'top',
            colors: this.controls.colors?.getValue() || DEFAULT_COLORS,
            animation: this.controls.animation?.getValue() ?? true
        };
    }

    setValues(config) {
        if (this.controls.title) this.controls.title.setValue(config.title || '');
        if (this.controls.subtitle) this.controls.subtitle.setValue(config.subtitle || '');
        if (this.controls.showLegend) this.controls.showLegend.setValue(config.showLegend !== false);
        if (this.controls.legendPosition) this.controls.legendPosition.setValue(config.legendPosition || 'top');
        if (this.controls.colors) this.controls.colors.setValue(config.colors || DEFAULT_COLORS);
        if (this.controls.animation) this.controls.animation.setValue(config.animation !== false);
    }
}

export { BaseConfig };
