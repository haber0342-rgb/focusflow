// js/app.js - Main Entry Point
import data from './data.js';

class App {
    constructor() {
        this.currentView = null;
        this.eventBus = document.createElement('div');
    }

    async init() {
        console.log('FocusFlow: Initializing...');
        
        // 1. Core Modules (Individual loading to prevent total failure)
        const modules = ['./notifications.js', './shortcuts.js', './planning.js', './focus.js'];
        for (const path of modules) {
            try {
                await import(path);
            } catch (e) {
                console.warn(`FocusFlow: Optional module "${path}" failed to load.`, e);
            }
        }

        // 2. Data Initialization
        try {
            data.initRollover();
        } catch (e) {
            console.error('FocusFlow: Data init failed.', e);
        }

        // 3. Intercept Share Links
        await this.handleShareLink();

        // 4. UI Setup
        this.initLucide();
        this.initNavigation();
        
        // 5. Router Registration
        window.addEventListener('hashchange', () => this.route());
        
        // 6. Initial Route (Force immediate run)
        this.route();

        // 7. SW Registration
        this.registerServiceWorker();

        console.log('FocusFlow: Initialization finished.');
    }

    async handleShareLink() {
        const hash = window.location.hash;
        if (hash.startsWith('#share=')) {
            const payload = hash.replace('#share=', '');
            try {
                const { default: sharing } = await import('./sharing.js');
                await sharing.handleImport(payload);
                history.replaceState(null, document.title, window.location.pathname + window.location.search);
            } catch (err) {
                console.error('FocusFlow: Share process failed.', err);
            }
        }
    }

    async route() {
        const hash = window.location.hash || '#dashboard';
        const viewName = hash.startsWith('#') ? hash.substring(1) : 'dashboard';
        
        // Handle route parameters (e.g., #share=) by prioritizing core views
        const validViews = ['dashboard', 'list', 'kanban', 'eisenhower', 'calendar', 'reports', 'settings'];
        const targetView = validViews.includes(viewName) ? viewName : 'dashboard';

        console.log(`FocusFlow: Navigating to "${targetView}"`);

        // Sync Sidebar UI
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === targetView);
        });

        await this.loadView(targetView);
    }

    async loadView(name) {
        const container = document.getElementById('view-container');
        if (!container) return;
        
        container.innerHTML = '<div style="padding: 20px; color: var(--text-dim);">Loading...</div>';
        
        try {
            const module = await import(`./views/${name}.js`);
            if (this.currentView && this.currentView.destroy) {
                this.currentView.destroy();
            }
            
            this.currentView = new module.default();
            const viewEl = await this.currentView.render();
            
            if (viewEl instanceof HTMLElement) {
                container.innerHTML = '';
                container.appendChild(viewEl);
                this.initLucide();
            }
        } catch (err) {
            console.error(`FocusFlow: View "${name}" load error.`, err);
            container.innerHTML = `
                <div class="card" style="border-top: 4px solid var(--accent-danger);">
                    <h2>Unable to load view</h2>
                    <p class="text-muted">${err.message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()" style="margin-top: 16px;">Reload App</button>
                </div>
            `;
        }
    }

    initLucide() {
        if (window.lucide) window.lucide.createIcons();
    }

    initNavigation() {
        document.querySelectorAll('.nav-item').forEach(el => {
            el.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (link && link.getAttribute('href').startsWith('#')) {
                    // Hash change will trigger route()
                }
            });
        });
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .catch(err => console.warn('FocusFlow: SW registration skipped.', err));
        }
    }

    on(event, callback) { this.eventBus.addEventListener(event, callback); }
    emit(event, detail) { this.eventBus.dispatchEvent(new CustomEvent(event, { detail })); }
}

window.app = new App();
window.app.init();
export default window.app;
