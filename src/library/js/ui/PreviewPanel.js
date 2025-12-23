import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { EVENTS, CHART_TYPES } from '../utils/constants.js';
import { ChartFactory } from '../charts/ChartFactory.js';
import { DataTransformer } from '../data/DataTransformer.js';

/**
 * Demo data for different chart types
 */
const DEMO_DATA = {
    [CHART_TYPES.LINE]: [
        { month: 'Jan', sales: 120, revenue: 80 },
        { month: 'Feb', sales: 150, revenue: 95 },
        { month: 'Mar', sales: 180, revenue: 120 },
        { month: 'Apr', sales: 140, revenue: 90 },
        { month: 'May', sales: 200, revenue: 150 },
        { month: 'Jun', sales: 220, revenue: 170 }
    ],
    [CHART_TYPES.BAR]: [
        { category: 'Product A', Q1: 45, Q2: 55, Q3: 60 },
        { category: 'Product B', Q1: 30, Q2: 40, Q3: 35 },
        { category: 'Product C', Q1: 65, Q2: 70, Q3: 80 },
        { category: 'Product D', Q1: 50, Q2: 45, Q3: 55 }
    ],
    [CHART_TYPES.PIE]: [
        { name: 'Electronics', value: 335 },
        { name: 'Clothing', value: 210 },
        { name: 'Food', value: 180 },
        { name: 'Books', value: 125 },
        { name: 'Other', value: 90 }
    ]
};

/**
 * PreviewPanel - Chart preview container
 */
class PreviewPanel extends BaseComponent {
    constructor(container) {
        super(container);
        this.chart = null;
        this.chartContainer = null;
        this.isUsingDemoData = true;
    }

    init() {
        super.init();
        this.on(EVENTS.CHART_TYPE_CHANGED, this.onTypeChange.bind(this));
        this.on(EVENTS.CONFIG_UPDATED, this.onConfigUpdate.bind(this));
        this.on(EVENTS.QUERY_EXECUTED, this.onDataUpdate.bind(this));
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-preview-panel' });

        // Header with export button
        const header = this.createElement('div', { className: 'gb-preview-header' });
        const title = this.createElement('span', { className: 'gb-preview-title' }, 'Preview');

        // Demo badge
        this.demoBadge = this.createElement('span', { className: 'gb-preview-demo-badge' }, 'Demo Data');

        const exportBtn = this.createElement('button', {
            className: 'gb-preview-export-btn',
            type: 'button'
        }, 'Export PNG');

        this.bindEvent(exportBtn, 'click', () => this.exportAsImage('png'));

        header.appendChild(title);
        header.appendChild(this.demoBadge);
        header.appendChild(exportBtn);

        // Chart container
        this.chartContainer = this.createElement('div', { className: 'gb-preview-chart' });

        this.element.appendChild(header);
        this.element.appendChild(this.chartContainer);

        this.container.appendChild(this.element);

        // Initialize chart with current type
        const chartType = stateManager.getChartType();
        this.initChart(chartType);

        // Check for existing data or show demo
        const data = stateManager.getData();
        if (data && data.length > 0) {
            this.isUsingDemoData = false;
            this.updateChart();
        } else {
            this.showDemoChart(chartType);
        }

        this.updateDemoBadge();
    }

    initChart(type) {
        if (this.chart) {
            this.chart.dispose();
        }

        this.chart = ChartFactory.create(type, this.chartContainer);
        this.chart.init();

        // Apply current config with dataMapping
        const config = stateManager.getConfig();
        const dataMapping = stateManager.getDataMapping();
        this.chart.setConfig({ ...config, dataMapping });
    }

    getDemoData(chartType) {
        return DEMO_DATA[chartType] || DEMO_DATA[CHART_TYPES.LINE];
    }

    showDemoChart(chartType) {
        if (!this.chart) return;

        this.isUsingDemoData = true;
        const demoData = this.getDemoData(chartType);
        const config = stateManager.getConfig();

        // Add demo title if none set
        const demoConfig = { ...config };
        if (!demoConfig.base.title) {
            demoConfig.base = { ...demoConfig.base, title: 'Demo Preview' };
        }

        const transformedData = DataTransformer.transform(demoData, chartType);
        this.chart.setConfig(demoConfig);
        this.chart.setData(transformedData);

        this.updateDemoBadge();
    }

    updateDemoBadge() {
        if (this.demoBadge) {
            this.demoBadge.style.display = this.isUsingDemoData ? 'inline-block' : 'none';
        }
    }

    updateChart() {
        if (!this.chart) return;

        const rawData = stateManager.getData();
        const chartType = stateManager.getChartType();
        const config = stateManager.getConfig();
        const dataMapping = stateManager.getDataMapping();

        if (!rawData || rawData.length === 0) {
            this.isUsingDemoData = true;
            this.showDemoChart(chartType);
            return;
        }

        this.isUsingDemoData = false;
        this.updateDemoBadge();

        // Transform data based on chart type
        const transformedData = DataTransformer.transform(rawData, chartType);

        this.chart.setConfig({ ...config, dataMapping });
        this.chart.setData(transformedData);
    }

    onTypeChange({ type }) {
        this.initChart(type);

        const data = stateManager.getData();
        if (data && data.length > 0) {
            this.isUsingDemoData = false;
            this.updateChart();
        } else {
            this.showDemoChart(type);
        }

        this.updateDemoBadge();
    }

    onConfigUpdate() {
        if (!this.chart) return;
        const config = stateManager.getConfig();
        const dataMapping = stateManager.getDataMapping();

        if (this.isUsingDemoData) {
            const demoConfig = { ...config, dataMapping };
            if (!demoConfig.base.title) {
                demoConfig.base = { ...demoConfig.base, title: 'Demo Preview' };
            }
            this.chart.setConfig(demoConfig);
        } else {
            this.chart.setConfig({ ...config, dataMapping });
        }

        this.chart.render();
    }

    onDataUpdate() {
        this.updateChart();
    }

    resize() {
        if (this.chart) {
            this.chart.resize();
        }
    }

    exportAsImage(format = 'png') {
        if (!this.chart) return;

        const dataUrl = this.chart.exportAsImage(format);
        if (!dataUrl) return;

        const link = document.createElement('a');
        link.download = `chart.${format}`;
        link.href = dataUrl;
        link.click();
    }

    getChartOption() {
        return this.chart?.getOption() || null;
    }

    destroy() {
        if (this.chart) {
            this.chart.dispose();
            this.chart = null;
        }
        super.destroy();
    }
}

export { PreviewPanel };
