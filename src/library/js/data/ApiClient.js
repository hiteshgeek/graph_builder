import { API_ENDPOINTS } from '../utils/constants.js';

/**
 * ApiClient - HTTP client for backend API communication
 * Uses FormData with $_POST['submit'] pattern for your framework
 */
class ApiClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
    }

    /**
     * Get the controller endpoint URL
     * @returns {string}
     */
    getEndpointUrl() {
        const basePath = this.baseUrl || this.getBasePath();
        return basePath + API_ENDPOINTS.CONTROLLER;
    }

    /**
     * Get base path from current page URL
     * @returns {string}
     */
    getBasePath() {
        const path = window.location.pathname;
        // Find the project root (e.g., /graph_builder/)
        const match = path.match(/^(\/[^/]+\/)/);
        return match ? match[1] : '/';
    }

    /**
     * Generic POST request using FormData with submit action
     * @param {string} action - The submit action name
     * @param {Object} data - Data to send
     * @returns {Promise<Object>}
     */
    async post(action, data = {}) {
        const formData = new FormData();
        formData.append('submit', action);

        // Add all data fields
        for (const [key, value] of Object.entries(data)) {
            if (value === null || value === undefined) continue;
            if (typeof value === 'object') {
                // Objects and arrays are JSON-encoded
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        }

        const response = await fetch(this.getEndpointUrl(), {
            method: 'POST',
            body: formData  // No Content-Type header - browser sets multipart boundary
        });

        return this.handleResponse(response);
    }

    /**
     * Execute SQL query
     * @param {string} sql
     * @returns {Promise<Object>}
     */
    async executeQuery(sql) {
        const response = await this.post('query-execute', { sql });

        if (!response.success) {
            const errorMsg = response.screen_message?.[0]?.message || 'Query failed';
            throw new Error(errorMsg);
        }

        // Extract data from Utility::ajaxResponseTrue format
        const responseData = response.data || {};

        return {
            data: responseData.data || responseData,
            columns: responseData.columns || [],
            rowCount: responseData.rowCount || 0,
            warnings: response.warnings || []
        };
    }

    /**
     * Save graph configuration
     * @param {Object} data Graph configuration data
     * @returns {Promise<Object>}
     */
    async saveGraph(data) {
        return this.post('graph-save', data);
    }

    /**
     * List saved graphs
     * @param {Object} params Query params (chartType, search, limit, offset)
     * @returns {Promise<Object>}
     */
    async listGraphs(params = {}) {
        return this.post('graphs-list-ajax', params);
    }

    /**
     * Get a single graph by ID or slug
     * @param {string|number} identifier Graph ID or slug
     * @returns {Promise<Object>}
     */
    async getGraph(identifier) {
        const param = typeof identifier === 'number' ? { id: identifier } : { slug: identifier };
        return this.post('graph-get', param);
    }

    /**
     * Delete a graph
     * @param {number} id Graph ID
     * @returns {Promise<Object>}
     */
    async deleteGraph(id) {
        return this.post('graph-delete', { id });
    }

    /**
     * Render a graph with filters
     * @param {string|number} identifier Graph ID or slug
     * @param {Array} filters Runtime filters
     * @returns {Promise<Object>}
     */
    async renderGraph(identifier, filters = []) {
        const data = typeof identifier === 'number'
            ? { id: identifier, filters }
            : { slug: identifier, filters };
        return this.post('graph-render', data);
    }

    /**
     * Get database tables
     * @param {string} search Optional search filter
     * @returns {Promise<Object>}
     */
    async getTables(search = '') {
        return this.post('schema-tables', { search });
    }

    /**
     * Get table fields/columns
     * @param {string} table Table name
     * @returns {Promise<Object>}
     */
    async getFields(table) {
        return this.post('schema-fields', { table });
    }

    /**
     * Handle response from Utility::ajaxResponse format
     * @param {Response} response
     * @returns {Promise<Object>}
     */
    async handleResponse(response) {
        let data;

        try {
            data = await response.json();
        } catch (e) {
            throw new Error('Invalid JSON response from server');
        }

        // Utility::ajaxResponse format has: success, data, screen_message, custom_data
        if (!data.success) {
            const errorMsg = data.screen_message?.[0]?.message || 'Request failed';
            throw new Error(errorMsg);
        }

        return data;
    }
}

// Singleton instance
const apiClient = new ApiClient();

export { ApiClient, apiClient };
