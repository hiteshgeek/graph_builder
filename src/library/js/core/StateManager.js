import { eventBus } from './EventBus.js';
import { EVENTS, CHART_TYPES, DEFAULT_CONFIG } from '../utils/constants.js';

/**
 * StateManager - Centralized state with localStorage persistence
 */
class StateManager {
    constructor() {
        this.storageKey = 'graphBuilder_state';
        this.state = this.getDefaultState();
        this.loadFromStorage();
    }

    getDefaultState() {
        return {
            chartType: CHART_TYPES.LINE,
            query: '',
            data: [],
            columns: [],
            dataMapping: {
                // For line/bar charts
                xAxis: null,      // Column name for X-axis (category)
                yAxis: [],        // Column names for Y-axis (values/series)
                // For pie charts
                nameField: null,  // Column name for slice names
                valueField: null  // Column name for slice values
            },
            dataSourceConfig: {
                type: 'sql',      // sql, api, callback, static
                query: '',        // SQL query
                apiUrl: '',       // API endpoint URL
                apiMethod: 'GET', // GET or POST
                apiHeaders: '',   // JSON string of headers
                apiBody: '',      // Request body for POST
                apiDataPath: '',  // Dot notation path to data in response
                callbackClass: '',    // PHP class name
                callbackMethod: '',   // PHP method name
                callbackParams: '',   // JSON string of params
                staticData: ''    // JSON string of static data
            },
            config: {
                base: { ...DEFAULT_CONFIG.base },
                line: { ...DEFAULT_CONFIG.line },
                bar: { ...DEFAULT_CONFIG.bar },
                pie: { ...DEFAULT_CONFIG.pie }
            }
        };
    }

    getState() {
        return { ...this.state };
    }

    setState(partial) {
        this.state = { ...this.state, ...partial };
        this.saveToStorage();
        eventBus.emit(EVENTS.STATE_CHANGED, this.state);
    }

    resetState() {
        this.state = this.getDefaultState();
        this.saveToStorage();
        eventBus.emit(EVENTS.STATE_CHANGED, this.state);
    }

    // Specific getters
    getChartType() {
        return this.state.chartType;
    }

    getQuery() {
        return this.state.query;
    }

    getData() {
        return this.state.data;
    }

    getColumns() {
        return this.state.columns;
    }

    getConfig() {
        return this.state.config;
    }

    getBaseConfig() {
        return this.state.config.base;
    }

    getTypeConfig(type = null) {
        const chartType = type || this.state.chartType;
        return this.state.config[chartType] || {};
    }

    getDataMapping() {
        return this.state.dataMapping;
    }

    getDataSourceConfig() {
        return this.state.dataSourceConfig;
    }

    // Specific setters
    setChartType(type) {
        if (this.state.chartType !== type) {
            this.state.chartType = type;
            this.saveToStorage();
            eventBus.emit(EVENTS.CHART_TYPE_CHANGED, { type });
        }
    }

    setQuery(query) {
        this.state.query = query;
        this.saveToStorage();
    }

    setData(data, columns = []) {
        this.state.data = data;
        this.state.columns = columns;
        // Auto-set default mapping if not set
        if (columns.length > 0 && !this.state.dataMapping.xAxis) {
            this.autoSetDataMapping(columns);
        }
        this.saveToStorage();
        eventBus.emit(EVENTS.QUERY_EXECUTED, { data, columns });
    }

    clearData() {
        this.state.data = [];
        this.state.columns = [];
        this.state.dataMapping = {
            xAxis: null,
            yAxis: [],
            nameField: null,
            valueField: null
        };
        this.saveToStorage();
        eventBus.emit(EVENTS.QUERY_EXECUTED, { data: [], columns: [] });
    }

    setDataMapping(mapping) {
        this.state.dataMapping = { ...this.state.dataMapping, ...mapping };
        this.saveToStorage();
        eventBus.emit(EVENTS.CONFIG_UPDATED, { dataMapping: this.state.dataMapping });
    }

    setDataSourceConfig(config) {
        this.state.dataSourceConfig = { ...this.state.dataSourceConfig, ...config };
        // Also update query for backwards compatibility
        if (config.type === 'sql' && config.query !== undefined) {
            this.state.query = config.query;
        }
        this.saveToStorage();
    }

    autoSetDataMapping(columns) {
        // Try to intelligently detect name vs value columns from actual data
        const data = this.state.data;
        let nameField = columns[0];
        let valueField = columns[1] || null;

        // For pie charts, detect which column has numeric values vs text labels
        if (data && data.length > 0 && columns.length >= 2) {
            const firstRowFirstCol = data[0][columns[0]];
            const firstRowSecondCol = data[0][columns[1]];

            // Check if first column is numeric and second is text
            const firstIsNumeric = typeof firstRowFirstCol === 'number' ||
                (!isNaN(parseFloat(firstRowFirstCol)) && isFinite(firstRowFirstCol));
            const secondIsNumeric = typeof firstRowSecondCol === 'number' ||
                (!isNaN(parseFloat(firstRowSecondCol)) && isFinite(firstRowSecondCol));

            // If first is numeric and second is not, swap them for pie chart mapping
            if (firstIsNumeric && !secondIsNumeric) {
                nameField = columns[1];
                valueField = columns[0];
            }
        }

        // For axis charts, first column is typically X-axis (category), rest are Y-axis (values)
        const xAxis = columns[0];
        const yAxis = columns.slice(1);

        this.state.dataMapping = {
            xAxis,
            yAxis,
            nameField,
            valueField
        };
    }

    setBaseConfig(config) {
        this.state.config.base = { ...this.state.config.base, ...config };
        this.saveToStorage();
        eventBus.emit(EVENTS.CONFIG_UPDATED, { base: this.state.config.base });
    }

    setTypeConfig(type, config) {
        if (this.state.config[type]) {
            this.state.config[type] = { ...this.state.config[type], ...config };
            this.saveToStorage();
            eventBus.emit(EVENTS.CONFIG_UPDATED, { [type]: this.state.config[type] });
        }
    }

    // Persistence
    saveToStorage() {
        try {
            const dataToSave = {
                chartType: this.state.chartType,
                query: this.state.query,
                dataMapping: this.state.dataMapping,
                dataSourceConfig: this.state.dataSourceConfig,
                config: this.state.config
            };
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
        } catch (e) {
            console.warn('Failed to save state to localStorage:', e);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = {
                    ...this.state,
                    chartType: parsed.chartType || this.state.chartType,
                    query: parsed.query || '',
                    dataMapping: parsed.dataMapping || this.state.dataMapping,
                    dataSourceConfig: { ...this.state.dataSourceConfig, ...(parsed.dataSourceConfig || {}) },
                    config: this.mergeConfig(this.state.config, parsed.config || {})
                };
            }
        } catch (e) {
            console.warn('Failed to load state from localStorage:', e);
        }
    }

    mergeConfig(defaults, saved) {
        const result = { ...defaults };
        for (const key of Object.keys(result)) {
            if (saved[key]) {
                result[key] = { ...result[key], ...saved[key] };
            }
        }
        return result;
    }

    clearStorage() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            console.warn('Failed to clear localStorage:', e);
        }
    }
}

export const stateManager = new StateManager();
export { StateManager };
