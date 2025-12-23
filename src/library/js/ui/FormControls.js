import { createElement } from '../utils/dom.js';
import { generateId } from '../utils/helpers.js';

/**
 * Create text input with label
 * @param {Object} options
 * @returns {Element}
 */
export function createTextInput(options) {
    const { name, label, value = '', placeholder = '', onChange } = options;
    const id = generateId('input');

    const wrapper = createElement('div', { className: 'gb-form-group' });
    const labelEl = createElement('label', { className: 'gb-form-label', for: id }, label);
    const input = createElement('input', {
        type: 'text',
        id,
        name,
        className: 'gb-form-input',
        value,
        placeholder
    });

    if (onChange) {
        input.addEventListener('input', (e) => onChange(e.target.value, name));
    }

    wrapper.appendChild(labelEl);
    wrapper.appendChild(input);
    wrapper.setValue = (val) => { input.value = val; };
    wrapper.getValue = () => input.value;

    return wrapper;
}

/**
 * Create checkbox with label
 * @param {Object} options
 * @returns {Element}
 */
export function createCheckbox(options) {
    const { name, label, checked = false, onChange } = options;
    const id = generateId('checkbox');

    const wrapper = createElement('div', { className: 'gb-form-group gb-form-group--checkbox' });
    const labelEl = createElement('label', { className: 'gb-form-checkbox-label', for: id });

    const input = createElement('input', {
        type: 'checkbox',
        id,
        name,
        className: 'gb-form-checkbox'
    });
    input.checked = checked;

    const span = createElement('span', { className: 'gb-form-checkbox-text' }, label);

    if (onChange) {
        input.addEventListener('change', (e) => onChange(e.target.checked, name));
    }

    labelEl.appendChild(input);
    labelEl.appendChild(span);
    wrapper.appendChild(labelEl);
    wrapper.setValue = (val) => { input.checked = val; };
    wrapper.getValue = () => input.checked;

    return wrapper;
}

/**
 * Create select dropdown
 * @param {Object} options
 * @returns {Element}
 */
export function createSelect(options) {
    const { name, label, value = '', selectOptions = [], onChange } = options;
    const id = generateId('select');

    const wrapper = createElement('div', { className: 'gb-form-group' });
    const labelEl = createElement('label', { className: 'gb-form-label', for: id }, label);
    const select = createElement('select', { id, name, className: 'gb-form-select' });

    selectOptions.forEach(opt => {
        const optValue = typeof opt === 'object' ? opt.value : opt;
        const optLabel = typeof opt === 'object' ? opt.label : opt;
        const option = createElement('option', { value: optValue }, optLabel);
        if (optValue === value) option.selected = true;
        select.appendChild(option);
    });

    if (onChange) {
        select.addEventListener('change', (e) => onChange(e.target.value, name));
    }

    wrapper.appendChild(labelEl);
    wrapper.appendChild(select);
    wrapper.setValue = (val) => { select.value = val; };
    wrapper.getValue = () => select.value;

    return wrapper;
}

/**
 * Create range slider with value display
 * @param {Object} options
 * @returns {Element}
 */
export function createRange(options) {
    const { name, label, value = 50, min = 0, max = 100, step = 1, onChange } = options;
    const id = generateId('range');

    const wrapper = createElement('div', { className: 'gb-form-group' });
    const labelWrapper = createElement('div', { className: 'gb-form-label-wrapper' });
    const labelEl = createElement('label', { className: 'gb-form-label', for: id }, label);
    const valueDisplay = createElement('span', { className: 'gb-form-range-value' }, String(value));

    const input = createElement('input', {
        type: 'range',
        id,
        name,
        className: 'gb-form-range',
        min: String(min),
        max: String(max),
        step: String(step),
        value: String(value)
    });

    input.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value;
        if (onChange) onChange(Number(e.target.value), name);
    });

    labelWrapper.appendChild(labelEl);
    labelWrapper.appendChild(valueDisplay);
    wrapper.appendChild(labelWrapper);
    wrapper.appendChild(input);
    wrapper.setValue = (val) => {
        input.value = val;
        valueDisplay.textContent = val;
    };
    wrapper.getValue = () => Number(input.value);

    return wrapper;
}

/**
 * Create color picker
 * @param {Object} options
 * @returns {Element}
 */
export function createColorPicker(options) {
    const { name, label, value = '#5470c6', onChange } = options;
    const id = generateId('color');

    const wrapper = createElement('div', { className: 'gb-form-group gb-form-group--color' });
    const labelEl = createElement('label', { className: 'gb-form-label', for: id }, label);
    const input = createElement('input', {
        type: 'color',
        id,
        name,
        className: 'gb-form-color',
        value
    });

    if (onChange) {
        input.addEventListener('change', (e) => onChange(e.target.value, name));
    }

    wrapper.appendChild(labelEl);
    wrapper.appendChild(input);
    wrapper.setValue = (val) => { input.value = val; };
    wrapper.getValue = () => input.value;

    return wrapper;
}

/**
 * Create color palette editor
 * @param {Object} options
 * @returns {Element}
 */
export function createColorPalette(options) {
    const { name, label, colors = [], onChange } = options;

    const wrapper = createElement('div', { className: 'gb-form-group gb-form-group--palette' });
    const labelEl = createElement('label', { className: 'gb-form-label' }, label);
    const paletteContainer = createElement('div', { className: 'gb-form-palette' });

    let currentColors = [...colors];

    const renderColors = () => {
        paletteContainer.innerHTML = '';
        currentColors.forEach((color, index) => {
            const colorItem = createElement('div', { className: 'gb-form-palette-item' });
            const input = createElement('input', {
                type: 'color',
                className: 'gb-form-palette-color',
                value: color
            });

            input.addEventListener('change', (e) => {
                currentColors[index] = e.target.value;
                if (onChange) onChange([...currentColors], name);
            });

            colorItem.appendChild(input);
            paletteContainer.appendChild(colorItem);
        });
    };

    renderColors();
    wrapper.appendChild(labelEl);
    wrapper.appendChild(paletteContainer);
    wrapper.setValue = (val) => {
        currentColors = [...val];
        renderColors();
    };
    wrapper.getValue = () => [...currentColors];

    return wrapper;
}

/**
 * Create form section with title
 * @param {string} title
 * @param {Element[]} controls
 * @returns {Element}
 */
export function createFormSection(title, controls = []) {
    const section = createElement('div', { className: 'gb-form-section' });
    const header = createElement('div', { className: 'gb-form-section-header' }, title);

    section.appendChild(header);
    controls.forEach(control => section.appendChild(control));

    return section;
}
