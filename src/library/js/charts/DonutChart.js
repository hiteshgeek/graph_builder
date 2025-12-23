import { PieChart } from './PieChart.js';

/**
 * DonutChart - Pie chart with inner radius
 */
class DonutChart extends PieChart {
    getSeriesType() {
        return 'pie';
    }

    /**
     * Get inner radius for donut
     * @returns {number}
     */
    getInnerRadius() {
        const config = this.config.donut || {};
        return config.innerRadius || 40;
    }

    setInnerRadius(value) {
        this.config.donut = { ...this.config.donut, innerRadius: value };
        this.render();
    }
}

export { DonutChart };
