import { BaseChart } from './BaseChart.js';

/**
 * LineChart - Line/Area chart implementation
 */
class LineChart extends BaseChart {
    getSeriesType() {
        return 'line';
    }

    /**
     * Transform data for line chart using dataMapping
     * @param {Array} rawData
     * @returns {Object}
     */
    transformData(rawData) {
        const axisLabelColor = this.getTextColor();
        const axisLineColor = this.getBorderColor();
        const splitLineColor = this.getBorderColorLight();

        if (!rawData || rawData.length === 0) {
            return {
                xAxis: {
                    type: 'category',
                    data: [],
                    axisLine: { show: true, lineStyle: { color: axisLineColor } },
                    axisLabel: { show: true, color: axisLabelColor }
                },
                yAxis: {
                    type: 'value',
                    axisLine: { show: true, lineStyle: { color: axisLineColor } },
                    axisLabel: { show: true, color: axisLabelColor },
                    splitLine: { show: true, lineStyle: { color: splitLineColor } }
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
        const typeConfig = this.config.line || {};

        const series = yAxisColumns.map(col => ({
            name: col,
            type: 'line',
            data: rawData.map(row => row[col]),
            smooth: typeConfig.smooth || false,
            showSymbol: typeConfig.showSymbol !== false,
            symbolSize: typeConfig.symbolSize || 6,
            lineStyle: {
                width: typeConfig.lineWidth || 2
            },
            areaStyle: typeConfig.showArea ? { opacity: 0.3 } : undefined,
            step: typeConfig.stepLine !== 'none' ? typeConfig.stepLine : false
        }));

        // Get axis labels from config
        const xAxisLabel = typeConfig.xAxisLabel || '';
        const yAxisLabel = typeConfig.yAxisLabel || '';

        return {
            xAxis: {
                type: 'category',
                data: categories,
                axisLine: { show: true, lineStyle: { color: axisLineColor } },
                axisLabel: { show: true, color: axisLabelColor },
                name: xAxisLabel,
                nameLocation: 'middle',
                nameGap: 30,
                nameTextStyle: { color: axisLabelColor, fontSize: 12 }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: true, lineStyle: { color: axisLineColor } },
                axisLabel: { show: true, color: axisLabelColor },
                splitLine: { show: true, lineStyle: { color: splitLineColor } },
                name: yAxisLabel,
                nameLocation: 'middle',
                nameGap: 50,
                nameTextStyle: { color: axisLabelColor, fontSize: 12 }
            },
            series
        };
    }

    getTypeSpecificOptions() {
        const hasTitle = this.config.base?.title || this.config.base?.subtitle;
        const hasLegend = this.config.base?.showLegend;
        const legendPos = this.config.base?.legendPosition || 'top';
        const hasXLabel = !!this.config.line?.xAxisLabel;
        const hasYLabel = !!this.config.line?.yAxisLabel;

        let top = 20;
        if (hasTitle) top += 40;
        if (hasLegend && legendPos === 'top') top += 30;

        // Increase margins when axis labels are present
        let left = 60;
        let bottom = hasLegend && legendPos === 'bottom' ? 60 : 40;

        if (hasYLabel) left += 20;
        if (hasXLabel) bottom += 20;

        return {
            grid: {
                left: left,
                right: 20,
                top: top,
                bottom: bottom,
                containLabel: false
            }
        };
    }

    setSmooth(value) {
        this.config.line = { ...this.config.line, smooth: value };
        this.render();
    }

    setAreaFill(enabled) {
        this.config.line = { ...this.config.line, showArea: enabled };
        this.render();
    }

    setStepLine(type) {
        this.config.line = { ...this.config.line, stepLine: type };
        this.render();
    }

    setShowSymbol(show) {
        this.config.line = { ...this.config.line, showSymbol: show };
        this.render();
    }

    setSymbolSize(size) {
        this.config.line = { ...this.config.line, symbolSize: size };
        this.render();
    }

    setLineWidth(width) {
        this.config.line = { ...this.config.line, lineWidth: width };
        this.render();
    }
}

export { LineChart };
