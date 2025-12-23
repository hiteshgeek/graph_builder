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
            config: {
                base: { ...DEFAULT_CONFIG.base },
                line: { ...DEFAULT_CONFIG.line },
                bar: { ...DEFAULT_CONFIG.bar },
                pie: { ...DEFAULT_CONFIG.pie },
                donut: { ...DEFAULT_CONFIG.donut }
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
        this.saveToStorage();
        eventBus.emit(EVENTS.QUERY_EXECUTED, { data, columns });
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
