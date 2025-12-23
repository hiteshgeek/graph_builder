/**
 * Application constants
 */

export const CHART_TYPES = {
    LINE: 'line',
    BAR: 'bar',
    PIE: 'pie'
};

export const EVENTS = {
    CHART_TYPE_CHANGED: 'chart:type:changed',
    CONFIG_UPDATED: 'chart:config:updated',
    QUERY_EXECUTED: 'query:executed',
    QUERY_ERROR: 'query:error',
    PREVIEW_RENDER: 'preview:render',
    STATE_CHANGED: 'state:changed',
    THEME_CHANGED: 'theme:changed'
};

export const DEFAULT_COLORS = [
    '#5470c6',
    '#91cc75',
    '#fac858',
    '#ee6666',
    '#73c0de',
    '#3ba272',
    '#fc8452',
    '#9a60b4'
];

export const API_ENDPOINTS = {
    QUERY: 'api/query/execute.php'
};

export const DEFAULT_CONFIG = {
    base: {
        title: '',
        subtitle: '',
        showLegend: true,
        legendPosition: 'top',
        colors: [...DEFAULT_COLORS],  // Fixed palette, chart uses as many as needed
        animation: true
    },
    line: {
        smooth: false,
        showArea: false,
        showSymbol: true,
        symbolSize: 6,
        lineWidth: 2,
        stepLine: 'none'
    },
    bar: {
        horizontal: false,
        stacked: false,
        barWidth: 60,
        borderRadius: 0,
        barGap: 30
    },
    pie: {
        radius: 70,
        innerRadius: 0,
        borderRadius: 0,
        padAngle: 0,
        roseType: 'none',
        labelPosition: 'outside',
        showLabels: true,
        showPercentage: true
    }
};

export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};
