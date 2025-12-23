import { BaseComponent } from '../core/BaseComponent.js';
import { THEMES, EVENTS } from '../utils/constants.js';
import { eventBus } from '../core/EventBus.js';

/**
 * ThemeSwitcher - Light/Dark/System theme toggle
 */
class ThemeSwitcher extends BaseComponent {
    constructor(container) {
        super(container);
        this.storageKey = 'graphBuilder_theme';
        this.currentTheme = THEMES.SYSTEM;
    }

    init() {
        this.loadTheme();
        this.applyTheme();
        super.init();

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                if (this.currentTheme === THEMES.SYSTEM) {
                    this.applyTheme();
                }
            });
        }
    }

    render() {
        this.element = this.createElement('div', { className: 'gb-theme-switcher' });

        const themes = [
            { value: THEMES.LIGHT, label: 'Light', icon: this.getSunIcon() },
            { value: THEMES.DARK, label: 'Dark', icon: this.getMoonIcon() },
            { value: THEMES.SYSTEM, label: 'System', icon: this.getSystemIcon() }
        ];

        themes.forEach(({ value, label, icon }) => {
            const btn = this.createElement('button', {
                className: `gb-theme-btn ${this.currentTheme === value ? 'gb-theme-btn--active' : ''}`,
                dataset: { theme: value },
                type: 'button',
                title: label
            });
            btn.innerHTML = icon;

            this.bindEvent(btn, 'click', () => this.setTheme(value));
            this.element.appendChild(btn);
        });

        this.container.appendChild(this.element);
    }

    getSunIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>`;
    }

    getMoonIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>`;
    }

    getSystemIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>`;
    }

    loadTheme() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved && Object.values(THEMES).includes(saved)) {
                this.currentTheme = saved;
            }
        } catch (e) {
            console.warn('Failed to load theme from localStorage');
        }
    }

    saveTheme() {
        try {
            localStorage.setItem(this.storageKey, this.currentTheme);
        } catch (e) {
            console.warn('Failed to save theme to localStorage');
        }
    }

    setTheme(theme) {
        this.currentTheme = theme;
        this.saveTheme();
        this.applyTheme();
        this.updateButtons();
        eventBus.emit(EVENTS.THEME_CHANGED, { theme });
    }

    applyTheme() {
        let effectiveTheme = this.currentTheme;

        if (this.currentTheme === THEMES.SYSTEM) {
            effectiveTheme = this.getSystemTheme();
        }

        document.documentElement.setAttribute('data-theme', effectiveTheme);
    }

    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return THEMES.DARK;
        }
        return THEMES.LIGHT;
    }

    updateButtons() {
        if (!this.element) return;

        const buttons = this.element.querySelectorAll('.gb-theme-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('gb-theme-btn--active', btn.dataset.theme === this.currentTheme);
        });
    }

    getTheme() {
        return this.currentTheme;
    }

    getEffectiveTheme() {
        if (this.currentTheme === THEMES.SYSTEM) {
            return this.getSystemTheme();
        }
        return this.currentTheme;
    }
}

export { ThemeSwitcher };
