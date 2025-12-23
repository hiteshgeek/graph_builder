import { BaseChart } from './BaseChart.js';

/**
 * PieChart - Pie/Donut chart implementation with border radius and pad angle support
 */
class PieChart extends BaseChart {
    getSeriesType() {
        return 'pie';
    }

    /**
     * Transform data for pie chart using dataMapping
     * @param {Array} rawData
     * @returns {Object}
     */
    transformData(rawData) {
        if (!rawData || rawData.length === 0) {
            return { series: [] };
        }

        const mapping = this.config.dataMapping || {};
        const columns = Object.keys(rawData[0]);

        // Use mapping or fallback to auto-detect
        const nameColumn = mapping.nameField || columns.find(c => c.toLowerCase() === 'name') || columns[0];
        const valueColumn = mapping.valueField || columns.find(c => c.toLowerCase() === 'value') || columns[1];

        const pieData = rawData.map(row => ({
            name: row[nameColumn],
            value: parseFloat(row[valueColumn]) || 0
        }));

        const typeConfig = this.config.pie || {};
        const outerRadius = typeConfig.radius || 70;
        const innerRadius = typeConfig.innerRadius || 0;
        const borderRadius = typeConfig.borderRadius || 0;
        const padAngle = typeConfig.padAngle || 0;

        return {
            series: [{
                type: 'pie',
                radius: [`${innerRadius}%`, `${outerRadius}%`],
                center: ['50%', '55%'],
                roseType: typeConfig.roseType !== 'none' ? typeConfig.roseType : false,
                padAngle: padAngle,
                itemStyle: {
                    borderRadius: borderRadius
                },
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
        this.config.pie = { ...this.config.pie, radius: value };
        this.render();
    }

    setInnerRadius(value) {
        this.config.pie = { ...this.config.pie, innerRadius: value };
        this.render();
    }

    setBorderRadius(value) {
        this.config.pie = { ...this.config.pie, borderRadius: value };
        this.render();
    }

    setPadAngle(value) {
        this.config.pie = { ...this.config.pie, padAngle: value };
        this.render();
    }

    setRoseType(type) {
        this.config.pie = { ...this.config.pie, roseType: type };
        this.render();
    }

    setLabelPosition(position) {
        this.config.pie = { ...this.config.pie, labelPosition: position };
        this.render();
    }

    setShowLabels(show) {
        this.config.pie = { ...this.config.pie, showLabels: show };
        this.render();
    }

    setShowPercentage(show) {
        this.config.pie = { ...this.config.pie, showPercentage: show };
        this.render();
    }
}

export { PieChart };
