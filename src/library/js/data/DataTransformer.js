import { CHART_TYPES } from '../utils/constants.js';

/**
 * DataTransformer - Transform raw SQL results to chart-ready format
 */
class DataTransformer {
    /**
     * Analyze data structure and suggest chart type
     * @param {Array} rawData
     * @param {Array} columns
     * @returns {Object}
     */
    static analyzeData(rawData, columns) {
        if (!rawData || rawData.length === 0) {
            return { suggestedType: CHART_TYPES.LINE, structure: 'empty' };
        }

        const numericColumns = columns.filter(col => {
            return rawData.every(row => {
                const val = row[col];
                return val === null || val === undefined || !isNaN(parseFloat(val));
            });
        });

        const textColumns = columns.filter(col => !numericColumns.includes(col));

        if (textColumns.length === 1 && numericColumns.length === 1) {
            return { suggestedType: CHART_TYPES.PIE, structure: 'name-value' };
        }

        if (textColumns.length >= 1 && numericColumns.length >= 1) {
            return { suggestedType: CHART_TYPES.BAR, structure: 'category-values' };
        }

        return { suggestedType: CHART_TYPES.LINE, structure: 'unknown' };
    }

    /**
     * Transform for line/bar charts (category + values)
     * @param {Array} rawData
     * @param {Object} options
     * @returns {Array}
     */
    static toCartesian(rawData, options = {}) {
        if (!rawData || rawData.length === 0) return [];

        const columns = Object.keys(rawData[0]);
        const categoryColumn = options.categoryColumn || columns[0];
        const valueColumns = options.valueColumns || columns.slice(1);

        return rawData.map(row => {
            const result = { [categoryColumn]: row[categoryColumn] };
            valueColumns.forEach(col => {
                result[col] = parseFloat(row[col]) || 0;
            });
            return result;
        });
    }

    /**
     * Transform for pie charts (name + value pairs)
     * @param {Array} rawData
     * @param {Object} options
     * @returns {Array}
     */
    static toPie(rawData, options = {}) {
        if (!rawData || rawData.length === 0) return [];

        const columns = Object.keys(rawData[0]);
        const nameColumn = options.nameColumn || columns[0];
        const valueColumn = options.valueColumn || columns[1];

        return rawData.map(row => ({
            name: String(row[nameColumn] || ''),
            value: parseFloat(row[valueColumn]) || 0
        }));
    }

    /**
     * Auto-transform based on chart type
     * @param {Array} rawData
     * @param {string} chartType
     * @param {Object} options
     * @returns {Array}
     */
    static transform(rawData, chartType, options = {}) {
        if (!rawData || rawData.length === 0) return [];

        switch (chartType) {
            case CHART_TYPES.PIE:
                return this.toPie(rawData, options);

            case CHART_TYPES.LINE:
            case CHART_TYPES.BAR:
            default:
                return this.toCartesian(rawData, options);
        }
    }

    /**
     * Detect category column (first text column)
     * @param {Array} rawData
     * @param {Array} columns
     * @returns {string|null}
     */
    static detectCategoryColumn(rawData, columns) {
        if (!columns || columns.length === 0) return null;

        for (const col of columns) {
            const isText = rawData.some(row => {
                const val = row[col];
                return val !== null && val !== undefined && isNaN(parseFloat(val));
            });
            if (isText) return col;
        }

        return columns[0];
    }

    /**
     * Detect value columns (numeric columns)
     * @param {Array} rawData
     * @param {Array} columns
     * @returns {Array}
     */
    static detectValueColumns(rawData, columns) {
        if (!columns || columns.length === 0) return [];

        return columns.filter(col => {
            return rawData.every(row => {
                const val = row[col];
                return val === null || val === undefined || !isNaN(parseFloat(val));
            });
        });
    }

    /**
     * Aggregate data by category
     * @param {Array} rawData
     * @param {string} categoryColumn
     * @param {string} valueColumn
     * @param {string} aggregation - 'sum', 'avg', 'count', 'min', 'max'
     * @returns {Array}
     */
    static aggregate(rawData, categoryColumn, valueColumn, aggregation = 'sum') {
        if (!rawData || rawData.length === 0) return [];

        const groups = new Map();

        rawData.forEach(row => {
            const key = row[categoryColumn];
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(parseFloat(row[valueColumn]) || 0);
        });

        const result = [];
        groups.forEach((values, name) => {
            let value;
            switch (aggregation) {
                case 'avg':
                    value = values.reduce((a, b) => a + b, 0) / values.length;
                    break;
                case 'count':
                    value = values.length;
                    break;
                case 'min':
                    value = Math.min(...values);
                    break;
                case 'max':
                    value = Math.max(...values);
                    break;
                case 'sum':
                default:
                    value = values.reduce((a, b) => a + b, 0);
            }
            result.push({ name, value });
        });

        return result;
    }
}

export { DataTransformer };
