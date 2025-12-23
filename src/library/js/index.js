/**
 * Graph Builder Library
 * Modular Chart Builder with ECharts
 */

// Core
export { eventBus, EventBus } from './core/EventBus.js';
export { stateManager, StateManager } from './core/StateManager.js';
export { BaseComponent } from './core/BaseComponent.js';

// Charts
export { BaseChart } from './charts/BaseChart.js';
export { LineChart } from './charts/LineChart.js';
export { BarChart } from './charts/BarChart.js';
export { PieChart } from './charts/PieChart.js';
export { ChartFactory, CHART_CLASSES } from './charts/ChartFactory.js';

// Configuration
export { BaseConfig } from './config/BaseConfig.js';
export { LineConfig } from './config/LineConfig.js';
export { BarConfig } from './config/BarConfig.js';
export { PieConfig } from './config/PieConfig.js';
export { ConfigFactory, CONFIG_CLASSES } from './config/ConfigFactory.js';

// UI Components
export { GraphBuilder } from './ui/GraphBuilder.js';
export { TypeSwitcher } from './ui/TypeSwitcher.js';
export { ConfigPanel } from './ui/ConfigPanel.js';
export { DataImporter } from './ui/DataImporter.js';
export { QueryEditor } from './ui/QueryEditor.js';
export { PreviewPanel } from './ui/PreviewPanel.js';
export { ThemeSwitcher } from './ui/ThemeSwitcher.js';
export * from './ui/FormControls.js';

// Data Layer
export { ApiClient } from './data/ApiClient.js';
export { DataTransformer } from './data/DataTransformer.js';
export { QueryValidator } from './data/QueryValidator.js';

// Utilities
export * from './utils/constants.js';
export * from './utils/helpers.js';
export * from './utils/dom.js';

/**
 * Create and initialize Graph Builder
 * @param {Element|string} container - Container element or selector
 * @param {Object} options - Configuration options
 * @returns {GraphBuilder}
 */
export function createGraphBuilder(container, options = {}) {
    const builder = new GraphBuilder(container, options);
    builder.init();
    return builder;
}
