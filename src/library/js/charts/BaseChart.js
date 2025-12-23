import * as echarts from 'echarts';
import { debounce } from '../utils/helpers.js';

/**
 * BaseChart - Abstract base class for all chart types
 */
class BaseChart {
    constructor(container) {
        if (typeof container === 'string') {
            this.container = document.querySelector(container);
        } else {
            this.container = container;
        }

        if (!this.container) {
            throw new Error('Chart container not found');
        }

        this.chart = null;
        this.data = [];
        this.config = {};
        this.resizeHandler = debounce(() => this.resize(), 100);
    }

    /**
     * Get series type - override in subclass
     * @returns {string}
     */
    getSeriesType() {
        throw new Error('getSeriesType must be implemented');
    }

    /**
     * Transform data for chart - override in subclass
     * @param {Array} rawData
     * @returns {Object}
     */
    transformData(rawData) {
        throw new Error('transformData must be implemented');
    }

    /**
     * Get type-specific options - override in subclass
     * @returns {Object}
     */
    getTypeSpecificOptions() {
        return {};
    }

    /**
     * Initialize ECharts instance
     */
    init() {
        if (this.chart) {
            this.dispose();
        }

        this.chart = echarts.init(this.container);
        window.addEventListener('resize', this.resizeHandler);
    }

    /**
     * Set chart data
     * @param {Array} data
     */
    setData(data) {
        this.data = data || [];
        this.render();
    }

    /**
     * Set chart config
     * @param {Object} config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
        this.render();
    }

    /**
     * Render chart with current data and config
     */
    render() {
        if (!this.chart) {
            this.init();
        }

        const option = this.buildOption(this.data, this.config);
        // Use notMerge: true, lazyUpdate: false for clean option replacement
        this.chart.setOption(option, { notMerge: true, lazyUpdate: false });
    }

    /**
     * Build full ECharts option
     * @param {Array} data
     * @param {Object} config
     * @returns {Object}
     */
    buildOption(data, config) {
        const baseConfig = config.base || {};
        const transformed = this.transformData(data);

        return {
            ...this.getTitleOption(baseConfig),
            ...this.getLegendOption(baseConfig),
            ...this.getTooltipOption(),
            ...this.getColorOption(baseConfig),
            ...this.getAnimationOption(baseConfig),
            ...this.getTypeSpecificOptions(),
            ...transformed
        };
    }

    /**
     * Get title configuration
     * @param {Object} config
     * @returns {Object}
     */
    getTitleOption(config) {
        if (!config.title && !config.subtitle) {
            return {};
        }

        return {
            title: {
                text: config.title || '',
                subtext: config.subtitle || '',
                left: 'center',
                textStyle: {
                    color: 'var(--gb-text-primary)',
                    fontSize: 18,
                    fontWeight: 'bold'
                },
                subtextStyle: {
                    color: 'var(--gb-text-secondary)',
                    fontSize: 14
                }
            }
        };
    }

    /**
     * Get legend configuration
     * @param {Object} config
     * @returns {Object}
     */
    getLegendOption(config) {
        if (!config.showLegend) {
            return { legend: { show: false } };
        }

        const positionMap = {
            top: { top: 'top', left: 'center', orient: 'horizontal' },
            bottom: { bottom: 0, left: 'center', orient: 'horizontal' },
            left: { left: 0, top: 'middle', orient: 'vertical' },
            right: { right: 0, top: 'middle', orient: 'vertical' }
        };

        const position = positionMap[config.legendPosition] || positionMap.top;

        return {
            legend: {
                show: true,
                type: 'scroll',
                ...position,
                textStyle: {
                    color: 'var(--gb-text-primary)'
                }
            }
        };
    }

    /**
     * Get tooltip configuration
     * @returns {Object}
     */
    getTooltipOption() {
        return {
            tooltip: {
                trigger: this.getSeriesType() === 'pie' ? 'item' : 'axis',
                backgroundColor: 'var(--gb-bg-primary)',
                borderColor: 'var(--gb-border-color)',
                textStyle: {
                    color: 'var(--gb-text-primary)'
                }
            }
        };
    }

    /**
     * Get color configuration
     * @param {Object} config
     * @returns {Object}
     */
    getColorOption(config) {
        return {
            color: config.colors || undefined
        };
    }

    /**
     * Get animation configuration
     * @param {Object} config
     * @returns {Object}
     */
    getAnimationOption(config) {
        return {
            animation: config.animation !== false,
            animationDuration: 500,
            animationEasing: 'cubicOut'
        };
    }

    /**
     * Resize chart
     */
    resize() {
        if (this.chart) {
            this.chart.resize();
        }
    }

    /**
     * Dispose chart instance
     */
    dispose() {
        window.removeEventListener('resize', this.resizeHandler);
        if (this.chart) {
            this.chart.dispose();
            this.chart = null;
        }
    }

    /**
     * Get chart instance
     * @returns {echarts.ECharts}
     */
    getInstance() {
        return this.chart;
    }

    /**
     * Export as image
     * @param {string} type - 'png' or 'jpeg'
     * @returns {string} Data URL
     */
    exportAsImage(type = 'png') {
        if (!this.chart) return null;
        return this.chart.getDataURL({
            type: type,
            pixelRatio: 2,
            backgroundColor: '#fff'
        });
    }

    /**
     * Get current option
     * @returns {Object}
     */
    getOption() {
        if (!this.chart) return null;
        return this.chart.getOption();
    }
}

export { BaseChart };
