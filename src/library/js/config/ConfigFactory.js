import { LineConfig } from './LineConfig.js';
import { BarConfig } from './BarConfig.js';
import { PieConfig } from './PieConfig.js';
import { DonutConfig } from './DonutConfig.js';
import { CHART_TYPES } from '../utils/constants.js';

const CONFIG_CLASSES = {
    [CHART_TYPES.LINE]: LineConfig,
    [CHART_TYPES.BAR]: BarConfig,
    [CHART_TYPES.PIE]: PieConfig,
    [CHART_TYPES.DONUT]: DonutConfig
};

/**
 * ConfigFactory - Factory for creating config panel instances
 */
class ConfigFactory {
    /**
     * Create config panel by chart type
     * @param {string} type
     * @param {Element|string} container
     * @returns {BaseComponent}
     */
    static create(type, container) {
        const ConfigClass = CONFIG_CLASSES[type];

        if (!ConfigClass) {
            throw new Error(`Unknown config type: ${type}`);
        }

        return new ConfigClass(container);
    }

    /**
     * Get config class by type
     * @param {string} type
     * @returns {Function}
     */
    static getConfigClass(type) {
        return CONFIG_CLASSES[type];
    }

    /**
     * Check if type has config panel
     * @param {string} type
     * @returns {boolean}
     */
    static hasConfig(type) {
        return type in CONFIG_CLASSES;
    }
}

export { ConfigFactory, CONFIG_CLASSES };
