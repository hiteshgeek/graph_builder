import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { EVENTS, CHART_TYPES } from '../utils/constants.js';
import { ChartFactory } from '../charts/ChartFactory.js';
import { DataTransformer } from '../data/DataTransformer.js';

/**
 * Demo data for different chart types with corresponding mappings
 */
const DEMO_DATA = {
    [CHART_TYPES.LINE]: {
        data: [
            { month: 'Jan', sales: 120, revenue: 80 },
            { month: 'Feb', sales: 150, revenue: 95 },
            { month: 'Mar', sales: 180, revenue: 120 },
            { month: 'Apr', sales: 140, revenue: 90 },
            { month: 'May', sales: 200, revenue: 150 },
            { month: 'Jun', sales: 220, revenue: 170 }
        ],
        mapping: { xAxis: 'month', yAxis: ['sales', 'revenue'] }
    },
    [CHART_TYPES.BAR]: {
        data: [
            { category: 'Product A', Q1: 45, Q2: 55, Q3: 60 },
            { category: 'Product B', Q1: 30, Q2: 40, Q3: 35 },
            { category: 'Product C', Q1: 65, Q2: 70, Q3: 80 },
            { category: 'Product D', Q1: 50, Q2: 45, Q3: 55 }
        ],
        mapping: { xAxis: 'category', yAxis: ['Q1', 'Q2', 'Q3'] }
    },
    [CHART_TYPES.PIE]: {
        data: [
            { name: 'Electronics', value: 335 },
            { name: 'Clothing', value: 210 },
            { name: 'Food', value: 180 },
            { name: 'Books', value: 125 },
            { name: 'Other', value: 90 }
        ],
        mapping: { nameField: 'name', valueField: 'value' }
    }
};

const TABS = [
    { id: 'graph', label: 'Graph', icon: 'chart' },
    { id: 'js', label: 'JavaScript', icon: 'js' },
    { id: 'html', label: 'HTML', icon: 'html' }
];

/**
 * PreviewPanel - Chart preview container with code tabs
 */
class PreviewPanel extends BaseComponent {
    constructor(container) {
        super(container);
        this.chart = null;
        this.chartContainer = null;
        this.isUsingDemoData = true;
        this.activeTab = 'graph';
    }

    init() {
        super.init();
        this.on(EVENTS.CHART_TYPE_CHANGED, this.onTypeChange.bind(this));
        this.on(EVENTS.CONFIG_UPDATED, this.onConfigUpdate.bind(this));
        this.on(EVENTS.QUERY_EXECUTED, this.onDataUpdate.bind(this));
        this.on(EVENTS.THEME_CHANGED, this.onThemeChange.bind(this));
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-preview-panel' });

        // Header with tabs and buttons
        const header = this.createElement('div', { className: 'gb-preview-header' });

        // Tabs
        this.tabsContainer = this.createElement('div', { className: 'gb-preview-tabs' });
        TABS.forEach(tab => {
            const tabBtn = this.createElement('button', {
                className: `gb-preview-tab ${tab.id === this.activeTab ? 'gb-preview-tab--active' : ''}`,
                type: 'button',
                dataset: { tab: tab.id }
            });
            tabBtn.innerHTML = `<span class="gb-tab-icon">${this.getTabIcon(tab.icon)}</span><span>${tab.label}</span>`;
            this.bindEvent(tabBtn, 'click', () => this.switchTab(tab.id));
            this.tabsContainer.appendChild(tabBtn);
        });

        // Demo badge
        this.demoBadge = this.createElement('span', { className: 'gb-preview-demo-badge' }, 'Demo Data');

        // Actions container
        const actions = this.createElement('div', { className: 'gb-preview-actions' });

        // Export PNG button
        const exportPngBtn = this.createElement('button', {
            className: 'gb-preview-btn',
            type: 'button',
            title: 'Export as PNG'
        }, 'Export PNG');
        this.bindEvent(exportPngBtn, 'click', () => this.exportAsImage('png'));

        // Export Code button
        const exportCodeBtn = this.createElement('button', {
            className: 'gb-preview-btn gb-preview-btn--primary',
            type: 'button',
            title: 'Export all code files'
        }, 'Export Code');
        this.bindEvent(exportCodeBtn, 'click', () => this.exportCode());

        actions.appendChild(exportPngBtn);
        actions.appendChild(exportCodeBtn);

        header.appendChild(this.tabsContainer);
        header.appendChild(this.demoBadge);
        header.appendChild(actions);

        // Content area
        this.contentArea = this.createElement('div', { className: 'gb-preview-content' });

        // Chart container (Graph tab)
        this.chartContainer = this.createElement('div', { className: 'gb-preview-chart' });

        // Code containers
        this.jsContainer = this.createElement('div', { className: 'gb-preview-code', style: 'display: none' });
        this.htmlContainer = this.createElement('div', { className: 'gb-preview-code', style: 'display: none' });

        this.contentArea.appendChild(this.chartContainer);
        this.contentArea.appendChild(this.jsContainer);
        this.contentArea.appendChild(this.htmlContainer);

        this.element.appendChild(header);
        this.element.appendChild(this.contentArea);

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

    getTabIcon(type) {
        const icons = {
            chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4,18 9,12 13,15 20,6"></polyline>
            </svg>`,
            js: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 18l6-6-6-6"></path>
                <path d="M8 6l-6 6 6 6"></path>
            </svg>`,
            html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4 7 4 4 20 4 20 7"></polyline>
                <polyline points="4 17 4 20 20 20 20 17"></polyline>
                <line x1="12" y1="4" x2="12" y2="20"></line>
            </svg>`
        };
        return icons[type] || '';
    }

    switchTab(tabId) {
        this.activeTab = tabId;

        // Update tab buttons
        const tabs = this.tabsContainer.querySelectorAll('.gb-preview-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('gb-preview-tab--active', tab.dataset.tab === tabId);
        });

        // Show/hide containers
        this.chartContainer.style.display = tabId === 'graph' ? 'block' : 'none';
        this.jsContainer.style.display = tabId === 'js' ? 'block' : 'none';
        this.htmlContainer.style.display = tabId === 'html' ? 'block' : 'none';

        // Generate code when switching to code tabs
        if (tabId === 'js') {
            this.renderJsCode();
        } else if (tabId === 'html') {
            this.renderHtmlCode();
        } else if (tabId === 'graph') {
            // Resize chart when coming back to graph tab
            setTimeout(() => this.resize(), 10);
        }
    }

    renderJsCode() {
        const code = this.generateJsCode();
        this.jsContainer.innerHTML = '';

        const wrapper = this.createElement('div', { className: 'gb-code-wrapper' });

        // Copy button
        const copyBtn = this.createElement('button', {
            className: 'gb-code-copy-btn',
            type: 'button'
        }, 'Copy');
        this.bindEvent(copyBtn, 'click', () => this.copyToClipboard(code, copyBtn));

        const pre = this.createElement('pre', { className: 'gb-code-pre' });
        const codeEl = this.createElement('code', { className: 'language-javascript' });
        codeEl.textContent = code;

        // Apply syntax highlighting if available
        if (window.hljs) {
            window.hljs.highlightElement(codeEl);
        }

        pre.appendChild(codeEl);
        wrapper.appendChild(copyBtn);
        wrapper.appendChild(pre);
        this.jsContainer.appendChild(wrapper);
    }

    renderHtmlCode() {
        const code = this.generateHtmlCode();
        this.htmlContainer.innerHTML = '';

        const wrapper = this.createElement('div', { className: 'gb-code-wrapper' });

        // Copy button
        const copyBtn = this.createElement('button', {
            className: 'gb-code-copy-btn',
            type: 'button'
        }, 'Copy');
        this.bindEvent(copyBtn, 'click', () => this.copyToClipboard(code, copyBtn));

        const pre = this.createElement('pre', { className: 'gb-code-pre' });
        const codeEl = this.createElement('code', { className: 'language-html' });
        codeEl.textContent = code;

        // Apply syntax highlighting if available
        if (window.hljs) {
            window.hljs.highlightElement(codeEl);
        }

        pre.appendChild(codeEl);
        wrapper.appendChild(copyBtn);
        wrapper.appendChild(pre);
        this.htmlContainer.appendChild(wrapper);
    }

    generateJsCode() {
        // Build clean options from our config and data, not from ECharts internal state
        const chartType = stateManager.getChartType();
        const config = stateManager.getConfig();
        const baseConfig = config.base || {};

        // Get clean data - either real data or demo data
        let data, dataMapping;
        if (this.isUsingDemoData) {
            const demo = this.getDemoData(chartType);
            data = demo.data;
            dataMapping = demo.mapping;
        } else {
            data = stateManager.getData() || [];
            dataMapping = stateManager.getDataMapping() || {};
        }

        // Build clean option object
        const option = this.buildCleanOption(chartType, config, data, dataMapping);
        const optionStr = JSON.stringify(option, null, 2);

        // Generate data variable
        const dataStr = JSON.stringify(data, null, 2);

        return `// ECharts Configuration
// Include ECharts: <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>

// Chart data
const data = ${dataStr};

// Initialize chart
const chartDom = document.getElementById('chart-container');
const myChart = echarts.init(chartDom);

// Chart options
const option = ${optionStr};

// Apply options
myChart.setOption(option);

// Handle window resize
window.addEventListener('resize', function() {
    myChart.resize();
});`;
    }

    /**
     * Build clean ECharts option from our config
     * @param {string} chartType
     * @param {Object} config
     * @param {Array} data
     * @param {Object} dataMapping
     * @returns {Object}
     */
    buildCleanOption(chartType, config, data, dataMapping) {
        const baseConfig = config.base || {};
        const option = {};

        // Title
        if (baseConfig.title || baseConfig.subtitle) {
            option.title = {
                text: baseConfig.title || '',
                subtext: baseConfig.subtitle || '',
                left: 'center'
            };
        }

        // Legend
        if (baseConfig.showLegend) {
            const positionMap = {
                top: { top: 'top', left: 'center', orient: 'horizontal' },
                bottom: { bottom: 0, left: 'center', orient: 'horizontal' },
                left: { left: 0, top: 'middle', orient: 'vertical' },
                right: { right: 0, top: 'middle', orient: 'vertical' }
            };
            option.legend = {
                show: true,
                ...(positionMap[baseConfig.legendPosition] || positionMap.top)
            };
        }

        // Tooltip
        option.tooltip = {
            trigger: chartType === CHART_TYPES.PIE ? 'item' : 'axis'
        };

        // Colors
        if (baseConfig.colors && baseConfig.colors.length > 0) {
            option.color = baseConfig.colors;
        }

        // Animation
        option.animation = baseConfig.animation !== false;

        // Chart-type specific options
        if (chartType === CHART_TYPES.PIE) {
            option.series = this.buildPieSeries(data, dataMapping, config.pie || {});
        } else {
            const axisData = this.buildAxisData(chartType, data, dataMapping, config);
            option.xAxis = axisData.xAxis;
            option.yAxis = axisData.yAxis;
            option.series = axisData.series;
            option.grid = { left: 60, right: 20, top: 60, bottom: 40, containLabel: false };
        }

        return option;
    }

    /**
     * Build pie series data
     */
    buildPieSeries(data, mapping, pieConfig) {
        const nameField = mapping.nameField || 'name';
        const valueField = mapping.valueField || 'value';

        const pieData = data.map(row => ({
            name: row[nameField],
            value: parseFloat(row[valueField]) || 0
        }));

        const outerRadius = pieConfig.radius || 70;
        const innerRadius = pieConfig.innerRadius || 0;

        return [{
            type: 'pie',
            radius: [`${innerRadius}%`, `${outerRadius}%`],
            center: ['50%', '55%'],
            roseType: pieConfig.roseType !== 'none' ? pieConfig.roseType : false,
            padAngle: pieConfig.padAngle || 0,
            itemStyle: {
                borderRadius: pieConfig.borderRadius || 0
            },
            data: pieData,
            label: {
                show: pieConfig.showLabels !== false,
                position: pieConfig.labelPosition || 'outside'
            }
        }];
    }

    /**
     * Build axis data for line/bar charts
     */
    buildAxisData(chartType, data, mapping, config) {
        if (!data || data.length === 0) {
            return { xAxis: { type: 'category', data: [] }, yAxis: { type: 'value' }, series: [] };
        }

        const columns = Object.keys(data[0]);
        const xAxisColumn = mapping.xAxis || columns[0];
        const yAxisColumns = mapping.yAxis && mapping.yAxis.length > 0
            ? mapping.yAxis
            : columns.filter(c => c !== xAxisColumn);

        const categories = data.map(row => row[xAxisColumn]);
        const typeConfig = config[chartType] || {};
        const isHorizontal = chartType === CHART_TYPES.BAR && typeConfig.horizontal;

        const series = yAxisColumns.map(col => {
            const seriesItem = {
                name: col,
                type: chartType,
                data: data.map(row => row[col])
            };

            if (chartType === CHART_TYPES.LINE) {
                seriesItem.smooth = typeConfig.smooth || false;
                seriesItem.showSymbol = typeConfig.showSymbol !== false;
                if (typeConfig.showArea) {
                    seriesItem.areaStyle = { opacity: 0.3 };
                }
            } else if (chartType === CHART_TYPES.BAR) {
                if (typeConfig.stacked) {
                    seriesItem.stack = 'total';
                }
                seriesItem.barWidth = `${typeConfig.barWidth || 60}%`;
            }

            return seriesItem;
        });

        const categoryAxis = { type: 'category', data: categories };
        const valueAxis = { type: 'value' };

        if (isHorizontal) {
            return { xAxis: valueAxis, yAxis: categoryAxis, series };
        }
        return { xAxis: categoryAxis, yAxis: valueAxis, series };
    }

    generateHtmlCode() {
        const chartType = stateManager.getChartType();
        const config = stateManager.getConfig();
        const title = config.base.title || 'My Chart';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .chart-wrapper {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 20px;
            width: 100%;
            max-width: 900px;
        }
        #chart-container {
            width: 100%;
            height: 500px;
        }
    </style>
</head>
<body>
    <div class="chart-wrapper">
        <div id="chart-container"></div>
    </div>
    <script src="chart.js"></script>
</body>
</html>`;
    }

    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('gb-code-copy-btn--success');
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('gb-code-copy-btn--success');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    exportCode() {
        const jsCode = this.generateJsCode();
        const htmlCode = this.generateHtmlCode();
        const config = stateManager.getConfig();
        const chartType = stateManager.getChartType();
        const title = config.base.title || 'chart';
        const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Create a zip-like download by creating multiple files
        // For simplicity, we'll download them individually or as a combined file

        // Create combined file for easy download
        const combinedContent = `/* ============================================
   ${title} - ECharts Export
   Chart Type: ${chartType}
   Generated: ${new Date().toISOString()}
   ============================================ */

/* ================== HTML ================== */
/*
${htmlCode}
*/

/* ================== JavaScript ================== */
${jsCode}
`;

        // Download as single JS file with comments
        this.downloadFile(`${safeName}.js`, jsCode, 'text/javascript');

        // Also download HTML
        setTimeout(() => {
            this.downloadFile(`${safeName}.html`, htmlCode, 'text/html');
        }, 100);
    }

    downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
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
        const demo = this.getDemoData(chartType);
        const config = stateManager.getConfig();

        // Use demo-specific mapping, not user's mapping (which may not match demo columns)
        const demoMapping = demo.mapping;

        const transformedData = DataTransformer.transform(demo.data, chartType);
        this.chart.setConfig({ ...config, dataMapping: demoMapping });
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

        // Refresh code tabs if active
        if (this.activeTab === 'js') {
            this.renderJsCode();
        } else if (this.activeTab === 'html') {
            this.renderHtmlCode();
        }
    }

    onConfigUpdate() {
        if (!this.chart) return;
        const config = stateManager.getConfig();
        const dataMapping = stateManager.getDataMapping();

        this.chart.setConfig({ ...config, dataMapping });
        this.chart.render();

        // Refresh code tabs if active
        if (this.activeTab === 'js') {
            this.renderJsCode();
        } else if (this.activeTab === 'html') {
            this.renderHtmlCode();
        }
    }

    onDataUpdate() {
        this.updateChart();

        // Refresh code tabs if active
        if (this.activeTab === 'js') {
            this.renderJsCode();
        } else if (this.activeTab === 'html') {
            this.renderHtmlCode();
        }
    }

    onThemeChange() {
        // Re-render chart to apply new theme colors
        if (this.chart) {
            this.chart.render();
        }
    }

    resize() {
        if (this.chart && this.activeTab === 'graph') {
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
