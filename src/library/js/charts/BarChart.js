import { BaseChart } from './BaseChart.js';

/**
 * BarChart - Vertical/Horizontal bar chart implementation
 */
class BarChart extends BaseChart {
    getSeriesType() {
        return 'bar';
    }

    /**
     * Transform data for bar chart using dataMapping
     * @param {Array} rawData
     * @returns {Object}
     */
    transformData(rawData) {
        if (!rawData || rawData.length === 0) {
            return {
                xAxis: {
                    type: 'category',
                    data: [],
                    axisLine: { show: true },
                    axisLabel: { show: true }
                },
                yAxis: {
                    type: 'value',
                    axisLine: { show: true },
                    axisLabel: { show: true },
                    splitLine: { show: true }
                },
                series: []
            };
        }

        const mapping = this.config.dataMapping || {};
        const columns = Object.keys(rawData[0]);

        // Use mapping or fallback to first column as X, rest as Y
        const xAxisColumn = mapping.xAxis || columns[0];
        let yAxisColumns = mapping.yAxis && mapping.yAxis.length > 0
            ? mapping.yAxis
            : columns.filter(c => c !== xAxisColumn);

        const categories = rawData.map(row => row[xAxisColumn]);
        const typeConfig = this.config.bar || {};
        const isHorizontal = typeConfig.horizontal || false;

        const series = yAxisColumns.map(col => ({
            name: col,
            type: 'bar',
            data: rawData.map(row => row[col]),
            stack: typeConfig.stacked ? 'total' : undefined,
            barWidth: `${typeConfig.barWidth || 60}%`,
            barGap: `${typeConfig.barGap || 30}%`,
            itemStyle: {
                borderRadius: typeConfig.borderRadius || 0
            }
        }));

        const categoryAxis = {
            type: 'category',
            data: categories,
            axisLine: { show: true },
            axisLabel: { show: true }
        };

        const valueAxis = {
            type: 'value',
            axisLine: { show: true },
            axisLabel: { show: true },
            splitLine: { show: true }
        };

        if (isHorizontal) {
            return {
                xAxis: valueAxis,
                yAxis: categoryAxis,
                series
            };
        }

        return {
            xAxis: categoryAxis,
            yAxis: valueAxis,
            series
        };
    }

    getTypeSpecificOptions() {
        const hasTitle = this.config.base?.title || this.config.base?.subtitle;
        const hasLegend = this.config.base?.showLegend;
        const legendPos = this.config.base?.legendPosition || 'top';
        const isHorizontal = this.config.bar?.horizontal || false;

        let top = 20;
        if (hasTitle) top += 40;
        if (hasLegend && legendPos === 'top') top += 30;

        return {
            grid: {
                left: isHorizontal ? 80 : 60,
                right: 20,
                top: top,
                bottom: hasLegend && legendPos === 'bottom' ? 60 : 40,
                containLabel: false
            }
        };
    }

    setOrientation(horizontal) {
        this.config.bar = { ...this.config.bar, horizontal };
        this.render();
    }

    setStacked(enabled) {
        this.config.bar = { ...this.config.bar, stacked: enabled };
        this.render();
    }

    setBarWidth(width) {
        this.config.bar = { ...this.config.bar, barWidth: width };
        this.render();
    }

    setBarGap(gap) {
        this.config.bar = { ...this.config.bar, barGap: gap };
        this.render();
    }

    setBorderRadius(radius) {
        this.config.bar = { ...this.config.bar, borderRadius: radius };
        this.render();
    }
}

export { BarChart };
