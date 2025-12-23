import { eventBus } from './EventBus.js';
import { createElement, $ } from '../utils/dom.js';

/**
 * BaseComponent - Abstract base class for UI components
 */
class BaseComponent {
    constructor(container, options = {}) {
        if (typeof container === 'string') {
            this.container = document.querySelector(container);
        } else {
            this.container = container;
        }

        if (!this.container) {
            throw new Error('Container element not found');
        }

        this.options = options;
        this.element = null;
        this.eventBindings = [];
        this.busSubscriptions = [];
        this.initialized = false;
    }

    /**
     * Initialize component - override in subclass
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.render();
    }

    /**
     * Render component - override in subclass
     */
    render() {
        // Override in subclass
    }

    /**
     * Destroy component and cleanup
     */
    destroy() {
        this.unbindAll();
        this.unsubscribeAll();

        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        this.element = null;
        this.initialized = false;
    }

    /**
     * Query within component
     * @param {string} selector
     * @returns {Element}
     */
    $(selector) {
        return $(selector, this.element || this.container);
    }

    /**
     * Query all within component
     * @param {string} selector
     * @returns {NodeList}
     */
    $$(selector) {
        const context = this.element || this.container;
        return context.querySelectorAll(selector);
    }

    /**
     * Create element helper
     */
    createElement(tag, attrs = {}, children = []) {
        return createElement(tag, attrs, children);
    }

    /**
     * Bind DOM event with automatic cleanup
     * @param {Element} element
     * @param {string} event
     * @param {Function} handler
     * @param {Object} options
     */
    bindEvent(element, event, handler, options = {}) {
        const boundHandler = handler.bind(this);
        element.addEventListener(event, boundHandler, options);
        this.eventBindings.push({ element, event, handler: boundHandler, options });
    }

    /**
     * Unbind all DOM events
     */
    unbindAll() {
        this.eventBindings.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.eventBindings = [];
    }

    /**
     * Subscribe to EventBus with automatic cleanup
     * @param {string} event
     * @param {Function} handler
     */
    on(event, handler) {
        const unsubscribe = eventBus.on(event, handler, this);
        this.busSubscriptions.push(unsubscribe);
        return unsubscribe;
    }

    /**
     * Emit event on EventBus
     * @param {string} event
     * @param {*} data
     */
    emit(event, data) {
        eventBus.emit(event, data);
    }

    /**
     * Unsubscribe all EventBus listeners
     */
    unsubscribeAll() {
        this.busSubscriptions.forEach(unsubscribe => unsubscribe());
        this.busSubscriptions = [];
    }
}

export { BaseComponent };
