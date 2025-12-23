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

        return {
            xAxis: {
                type: 'category',
                data: categories,
                axisLine: { show: true, lineStyle: { color: axisLineColor } },
                axisLabel: { show: true, color: axisLabelColor }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: true, lineStyle: { color: axisLineColor } },
                axisLabel: { show: true, color: axisLabelColor },
                splitLine: { show: true, lineStyle: { color: splitLineColor } }
            },
            series
        };
    }

    getTypeSpecificOptions() {
        const hasTitle = this.config.base?.title || this.config.base?.subtitle;
        const hasLegend = this.config.base?.showLegend;
        const legendPos = this.config.base?.legendPosition || 'top';

        let top = 20;
        if (hasTitle) top += 40;
        if (hasLegend && legendPos === 'top') top += 30;

        return {
            grid: {
                left: 60,
                right: 20,
                top: top,
                bottom: hasLegend && legendPos === 'bottom' ? 60 : 40,
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
