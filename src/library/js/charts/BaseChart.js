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
     * Get computed color from CSS variable
     * @param {string} varName
     * @param {string} fallback
     * @returns {string}
     */
    getCssVar(varName, fallback = '#333') {
        const style = getComputedStyle(document.documentElement);
        const value = style.getPropertyValue(varName).trim();
        return value || fallback;
    }

    /**
     * Get theme-aware secondary text color
     * @returns {string}
     */
    getSecondaryColor() {
        return this.isDarkTheme() ? '#9ca3af' : '#606266';
    }

    /**
     * Get theme-aware border color
     * @returns {string}
     */
    getBorderColor() {
        return this.isDarkTheme() ? '#374151' : '#dcdfe6';
    }

    /**
     * Get theme-aware light border color
     * @returns {string}
     */
    getBorderColorLight() {
        return this.isDarkTheme() ? '#4b5563' : '#e4e7ed';
    }

    /**
     * Get theme-aware background color
     * @returns {string}
     */
    getBgColor() {
        return this.isDarkTheme() ? '#1a1a2e' : '#ffffff';
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
                    color: this.getTextColor(),
                    fontSize: 18,
                    fontWeight: 'bold'
                },
                subtextStyle: {
                    color: this.getSecondaryColor(),
                    fontSize: 14
                }
            }
        };
    }

    /**
     * Check if dark theme is active
     * @returns {boolean}
     */
    isDarkTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    /**
     * Get theme-aware text color
     * @returns {string}
     */
    getTextColor() {
        return this.isDarkTheme() ? '#f3f4f6' : '#1a1a2e';
    }

    /**
     * Get theme-aware muted text color
     * @returns {string}
     */
    getMutedColor() {
        return this.isDarkTheme() ? '#6b7280' : '#909399';
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
        const textColor = this.getTextColor();
        const mutedColor = this.getMutedColor();

        return {
            legend: {
                show: true,
                type: 'scroll',
                ...position,
                textStyle: {
                    color: textColor
                },
                pageTextStyle: {
                    color: mutedColor
                },
                pageIconColor: textColor,
                pageIconInactiveColor: mutedColor
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
                backgroundColor: this.getBgColor(),
                borderColor: this.getBorderColor(),
                textStyle: {
                    color: this.getTextColor()
                }
            }
        };
    }

    /**
     * Get color configuration
     * Uses colors from palette - ECharts automatically cycles through them as needed
     * @param {Object} config
     * @returns {Object}
     */
    getColorOption(config) {
        // Use colors from config palette - ECharts will cycle through them
        if (config.colors && config.colors.length > 0) {
            return { color: config.colors };
        }
        return {};
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
