import { BaseChart } from './BaseChart.js';

/**
 * PieChart - Basic pie chart implementation
 */
class PieChart extends BaseChart {
    getSeriesType() {
        return 'pie';
    }

    /**
     * Transform data for pie chart
     * Expects data in format: [{ name: 'Label', value: number }]
     * Or: [{ category: 'Label', value: number }]
     * @param {Array} rawData
     * @returns {Object}
     */
    transformData(rawData) {
        if (!rawData || rawData.length === 0) {
            return { series: [] };
        }

        const columns = Object.keys(rawData[0]);
        const nameColumn = columns.find(c => c.toLowerCase() === 'name') || columns[0];
        const valueColumn = columns.find(c => c.toLowerCase() === 'value') || columns[1];

        const pieData = rawData.map(row => ({
            name: row[nameColumn],
            value: parseFloat(row[valueColumn]) || 0
        }));

        const typeConfig = this.config.pie || this.config.donut || {};
        const innerRadius = this.getInnerRadius();
        const outerRadius = typeConfig.radius || 70;

        return {
            series: [{
                type: 'pie',
                radius: [`${innerRadius}%`, `${outerRadius}%`],
                center: ['50%', '55%'],
                roseType: typeConfig.roseType !== 'none' ? typeConfig.roseType : false,
                data: pieData,
                label: this.getLabelConfig(typeConfig),
                labelLine: {
                    show: typeConfig.showLabels !== false && typeConfig.labelPosition !== 'center'
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };
    }

    /**
     * Get inner radius for pie (0) or donut (configurable)
     * @returns {number}
     */
    getInnerRadius() {
        return 0;
    }

    /**
     * Get label configuration
     * @param {Object} config
     * @returns {Object}
     */
    getLabelConfig(config) {
        if (config.showLabels === false) {
            return { show: false };
        }

        const formatParts = ['{b}'];
        if (config.showPercentage !== false) {
            formatParts.push('({d}%)');
        }

        const position = config.labelPosition || 'outside';

        return {
            show: true,
            position: position,
            formatter: formatParts.join(' '),
            color: 'var(--gb-text-primary)'
        };
    }

    getTypeSpecificOptions() {
        return {};
    }

    setRadius(value) {
        const configKey = this.getSeriesType() === 'pie' ? 'pie' : 'donut';
        this.config[configKey] = { ...this.config[configKey], radius: value };
        this.render();
    }

    setRoseType(type) {
        const configKey = this.getSeriesType() === 'pie' ? 'pie' : 'donut';
        this.config[configKey] = { ...this.config[configKey], roseType: type };
        this.render();
    }

    setLabelPosition(position) {
        const configKey = this.getSeriesType() === 'pie' ? 'pie' : 'donut';
        this.config[configKey] = { ...this.config[configKey], labelPosition: position };
        this.render();
    }

    setShowLabels(show) {
        const configKey = this.getSeriesType() === 'pie' ? 'pie' : 'donut';
        this.config[configKey] = { ...this.config[configKey], showLabels: show };
        this.render();
    }

    setShowPercentage(show) {
        const configKey = this.getSeriesType() === 'pie' ? 'pie' : 'donut';
        this.config[configKey] = { ...this.config[configKey], showPercentage: show };
        this.render();
    }
}

export { PieChart };
