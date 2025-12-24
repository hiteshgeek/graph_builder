import { API_ENDPOINTS } from '../utils/constants.js';

/**
 * ApiClient - HTTP client for backend API communication
 */
class ApiClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
    }

    /**
     * Execute SQL query
     * @param {string} sql
     * @returns {Promise<Object>}
     */
    async executeQuery(sql) {
        const response = await this.post(API_ENDPOINTS.QUERY, { sql });

        if (!response.success) {
            throw new Error(response.error || response.errors?.join(', ') || 'Query failed');
        }

        return {
            data: response.data,
            columns: response.columns,
            rowCount: response.rowCount,
            warnings: response.warnings || []
        };
    }

    /**
     * Generic GET request
     * @param {string} endpoint
     * @param {Object} params
     * @returns {Promise<Object>}
     */
    async get(endpoint, params = {}) {
        // Build URL relative to current page
        const baseUrl = this.baseUrl || this.getBasePath();
        let url = baseUrl + endpoint;

        // Add query params
        const queryString = Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        if (queryString) {
            url += (url.includes('?') ? '&' : '?') + queryString;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        return this.handleResponse(response);
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
     * Generic POST request
     * @param {string} endpoint
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async post(endpoint, data = {}) {
        const baseUrl = this.baseUrl || this.getBasePath();
        const response = await fetch(baseUrl + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        return this.handleResponse(response);
    }

    /**
     * Save graph configuration
     * @param {Object} data Graph configuration data
     * @returns {Promise<Object>}
     */
    async saveGraph(data) {
        return this.post('api/graphs/save.php', data);
    }

    /**
     * List saved graphs
     * @param {Object} params Query params (chartType, search, limit, offset)
     * @returns {Promise<Object>}
     */
    async listGraphs(params = {}) {
        return this.get('api/graphs/list.php', params);
    }

    /**
     * Get a single graph by ID or slug
     * @param {string|number} identifier Graph ID or slug
     * @returns {Promise<Object>}
     */
    async getGraph(identifier) {
        const param = typeof identifier === 'number' ? { id: identifier } : { slug: identifier };
        return this.get('api/graphs/get.php', param);
    }

    /**
     * Delete a graph
     * @param {number} id Graph ID
     * @returns {Promise<Object>}
     */
    async deleteGraph(id) {
        return this.post('api/graphs/delete.php', { id });
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
        return this.post('api/graphs/render.php', data);
    }

    /**
     * Handle response
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

        if (!response.ok && !data.error && !data.errors) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return data;
    }
}

// Singleton instance
const apiClient = new ApiClient();

export { ApiClient, apiClient };
