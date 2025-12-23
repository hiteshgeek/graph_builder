import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { EVENTS } from '../utils/constants.js';
import { BaseConfig } from '../config/BaseConfig.js';
import { ConfigFactory } from '../config/ConfigFactory.js';
import { empty } from '../utils/dom.js';

/**
 * ConfigPanel - Container that swaps config modules based on chart type
 */
class ConfigPanel extends BaseComponent {
    constructor(container) {
        super(container);
        this.baseConfig = null;
        this.typeConfig = null;
        this.baseContainer = null;
        this.typeContainer = null;
    }

    init() {
        super.init();
        this.on(EVENTS.CHART_TYPE_CHANGED, this.onTypeChange.bind(this));
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-config-panel' });

        // Header
        const header = this.createElement('div', { className: 'gb-config-header' }, 'Configuration');
        this.element.appendChild(header);

        // Scrollable content
        const content = this.createElement('div', { className: 'gb-config-content' });

        // Base config container
        this.baseContainer = this.createElement('div', { className: 'gb-config-base' });
        content.appendChild(this.baseContainer);

        // Type-specific config container
        this.typeContainer = this.createElement('div', { className: 'gb-config-type' });
        content.appendChild(this.typeContainer);

        this.element.appendChild(content);
        this.container.appendChild(this.element);

        // Initialize base config
        this.initBaseConfig();

        // Initialize type-specific config based on current type
        const currentType = stateManager.getChartType();
        this.initTypeConfig(currentType);
    }

    initBaseConfig() {
        if (this.baseConfig) {
            this.baseConfig.destroy();
        }

        this.baseConfig = new BaseConfig(this.baseContainer);
        this.baseConfig.init();
    }

    initTypeConfig(type) {
        if (this.typeConfig) {
            this.typeConfig.destroy();
        }

        empty(this.typeContainer);

        if (ConfigFactory.hasConfig(type)) {
            this.typeConfig = ConfigFactory.create(type, this.typeContainer);
            this.typeConfig.init();
        }
    }

    onTypeChange({ type }) {
        this.initTypeConfig(type);
    }

    setChartType(type) {
        this.initTypeConfig(type);
    }

    getFullConfig() {
        return {
            base: this.baseConfig?.getValues() || {},
            type: this.typeConfig?.getValues() || {}
        };
    }

    setConfig(config) {
        if (config.base && this.baseConfig) {
            this.baseConfig.setValues(config.base);
        }
        if (config.type && this.typeConfig) {
            this.typeConfig.setValues(config.type);
        }
    }

    destroy() {
        if (this.baseConfig) {
            this.baseConfig.destroy();
            this.baseConfig = null;
        }
        if (this.typeConfig) {
            this.typeConfig.destroy();
            this.typeConfig = null;
        }
        super.destroy();
    }
}

export { ConfigPanel };
