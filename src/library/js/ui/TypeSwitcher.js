import { BaseComponent } from '../core/BaseComponent.js';
import { stateManager } from '../core/StateManager.js';
import { CHART_TYPES, EVENTS } from '../utils/constants.js';
import { delegate } from '../utils/dom.js';

/**
 * TypeSwitcher - Chart type selector with visual icons
 */
class TypeSwitcher extends BaseComponent {
    constructor(container) {
        super(container);
        this.types = Object.values(CHART_TYPES);
    }

    init() {
        super.init();
        this.on(EVENTS.CHART_TYPE_CHANGED, this.onTypeChange.bind(this));
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-type-switcher' });

        const currentType = stateManager.getChartType();

        this.types.forEach(type => {
            const button = this.createTypeButton(type, type === currentType);
            this.element.appendChild(button);
        });

        delegate(this.element, '.gb-type-btn', 'click', (e, target) => {
            const type = target.dataset.type;
            if (type) this.selectType(type);
        });

        this.container.appendChild(this.element);
    }

    createTypeButton(type, isActive = false) {
        const button = this.createElement('button', {
            className: `gb-type-btn ${isActive ? 'gb-type-btn--active' : ''}`,
            dataset: { type },
            type: 'button'
        });

        const icon = this.createElement('span', { className: 'gb-type-icon' });
        icon.innerHTML = this.getTypeIcon(type);

        const label = this.createElement('span', { className: 'gb-type-label' }, this.getTypeLabel(type));

        button.appendChild(icon);
        button.appendChild(label);

        return button;
    }

    getTypeIcon(type) {
        const icons = {
            [CHART_TYPES.LINE]: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4,18 9,12 13,15 20,6"></polyline>
            </svg>`,
            [CHART_TYPES.BAR]: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="12" width="4" height="8"></rect>
                <rect x="10" y="8" width="4" height="12"></rect>
                <rect x="16" y="4" width="4" height="16"></rect>
            </svg>`,
            [CHART_TYPES.PIE]: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9"></circle>
                <line x1="12" y1="12" x2="12" y2="3"></line>
                <line x1="12" y1="12" x2="20" y2="15"></line>
            </svg>`,
            [CHART_TYPES.DONUT]: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9"></circle>
                <circle cx="12" cy="12" r="4"></circle>
            </svg>`
        };
        return icons[type] || '';
    }

    getTypeLabel(type) {
        const labels = {
            [CHART_TYPES.LINE]: 'Line',
            [CHART_TYPES.BAR]: 'Bar',
            [CHART_TYPES.PIE]: 'Pie',
            [CHART_TYPES.DONUT]: 'Donut'
        };
        return labels[type] || type;
    }

    selectType(type) {
        stateManager.setChartType(type);
    }

    onTypeChange({ type }) {
        const buttons = this.element.querySelectorAll('.gb-type-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('gb-type-btn--active', btn.dataset.type === type);
        });
    }

    setActiveType(type) {
        this.selectType(type);
    }
}

export { TypeSwitcher };
