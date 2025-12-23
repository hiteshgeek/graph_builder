/**
 * DOM utility functions
 */

/**
 * Create element with attributes and children
 * @param {string} tag
 * @param {Object} attrs
 * @param {Array|string} children
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            for (const [dataKey, dataValue] of Object.entries(value)) {
                element.dataset[dataKey] = dataValue;
            }
        } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else {
            element.setAttribute(key, value);
        }
    }

    if (typeof children === 'string') {
        element.textContent = children;
    } else if (Array.isArray(children)) {
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
    }

    return element;
}

/**
 * Query selector shortcut
 * @param {string} selector
 * @param {Element} context
 * @returns {Element}
 */
export function $(selector, context = document) {
    return context.querySelector(selector);
}

/**
 * Query selector all shortcut
 * @param {string} selector
 * @param {Element} context
 * @returns {NodeList}
 */
export function $$(selector, context = document) {
    return context.querySelectorAll(selector);
}

/**
 * Add classes to element
 * @param {Element} el
 * @param {...string} classes
 */
export function addClass(el, ...classes) {
    el.classList.add(...classes);
}

/**
 * Remove classes from element
 * @param {Element} el
 * @param {...string} classes
 */
export function removeClass(el, ...classes) {
    el.classList.remove(...classes);
}

/**
 * Toggle class on element
 * @param {Element} el
 * @param {string} className
 * @param {boolean} force
 */
export function toggleClass(el, className, force) {
    el.classList.toggle(className, force);
}

/**
 * Event delegation
 * @param {Element} container
 * @param {string} selector
 * @param {string} event
 * @param {Function} handler
 */
export function delegate(container, selector, event, handler) {
    container.addEventListener(event, (e) => {
        const target = e.target.closest(selector);
        if (target && container.contains(target)) {
            handler.call(target, e, target);
        }
    });
}

/**
 * Get element bounding rect
 * @param {Element} el
 * @returns {DOMRect}
 */
export function getRect(el) {
    return el.getBoundingClientRect();
}

/**
 * Empty element contents
 * @param {Element} el
 */
export function empty(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

/**
 * Set multiple attributes
 * @param {Element} el
 * @param {Object} attrs
 */
export function setAttributes(el, attrs) {
    for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value);
    }
}
