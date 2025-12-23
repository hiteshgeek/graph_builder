import { LineChart } from './LineChart.js';
import { BarChart } from './BarChart.js';
import { PieChart } from './PieChart.js';
import { CHART_TYPES } from '../utils/constants.js';

const CHART_CLASSES = {
    [CHART_TYPES.LINE]: LineChart,
    [CHART_TYPES.BAR]: BarChart,
    [CHART_TYPES.PIE]: PieChart
};

/**
 * ChartFactory - Factory for creating chart instances
 */
class ChartFactory {
    /**
     * Create chart instance by type
     * @param {string} type
     * @param {Element|string} container
     * @returns {BaseChart}
     */
    static create(type, container) {
        const ChartClass = CHART_CLASSES[type];

        if (!ChartClass) {
            throw new Error(`Unknown chart type: ${type}`);
        }

        return new ChartClass(container);
    }

    /**
     * Get available chart types
     * @returns {string[]}
     */
    static getAvailableTypes() {
        return Object.values(CHART_TYPES);
    }

    /**
     * Check if type is valid
     * @param {string} type
     * @returns {boolean}
     */
    static isValidType(type) {
        return type in CHART_CLASSES;
    }

    /**
     * Get chart class by type
     * @param {string} type
     * @returns {Function}
     */
    static getChartClass(type) {
        return CHART_CLASSES[type];
    }
}

export { ChartFactory, CHART_CLASSES };
