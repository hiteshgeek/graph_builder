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

export { ApiClient };
