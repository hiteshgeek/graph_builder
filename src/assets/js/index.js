/**
 * Graph Builder Application
 * Entry point for the application
 */

import { GraphBuilder } from '../../library/js/ui/GraphBuilder.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('graph-builder');

    if (!container) {
        console.error('Graph builder container not found');
        return;
    }

    // Create and initialize the graph builder
    const graphBuilder = new GraphBuilder(container, {
        apiBase: ''
    });
    graphBuilder.init();

    // Expose to window for debugging
    window.graphBuilder = graphBuilder;
});
