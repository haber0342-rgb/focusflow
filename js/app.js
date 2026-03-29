// js/app.js - Main Entry Point
import data from './data.js';

class App {
    constructor() {
        this.currentView = null;
        this.eventBus = document.createElement('div');
        this.debugEl = null;
        // Determine base path for dynamic imports (handles GitHub Pages subdirectories)
        this.basePath = window.location.pathname.endsWith('/') 
            ? window.location.pathname 
            : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    }

    async init() {
        this.setupDebugUI();
        this.log(`FocusFlow: Initializing at ${this.basePath}...`);
        
        try {
            // 0. Kill stale Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let reg of registrations) {
                    await reg.unregister();
                    this.log('FocusFlow: SW unregistered.');
                }
            }

            // 1. Core Modules
            const modules = ['notifications.js', 'shortcuts.js', 'planning.js', 'focus.js'];
            for (const name of modules) {
                try {
                    await import(`./${name}`);
                    this.log(`FocusFlow: Loaded ${name}`);
                } catch (e) {
                    this.log(`FocusFlow: Warn - ${name} fail: ${e.message}`);
                }
            }

            // 2. Data Initialization
            data.initRollover();
            this.log('FocusFlow: Data ready.');

            // 3. Intercept Share Links
            await this.handleShareLink();

            // 4. UI Setup
            this.initLucide();
            this.initNavigation();
            
            // 5. Router Registration
            window.addEventListener('hashchange', () => this.route());
            
            // 6. Initial Route
            await this.route();

            this.log('FocusFlow: Init complete.');
        } catch (err) {
            this.log(`FocusFlow: FATAL - ${err.message}`, 'error');
        }
    }

    setupDebugUI() {
        const container = document.getElementById('view-container');
        if (!container) return;
        this.debugEl = document.createElement('div');
        this.debugEl.style.cssText = 'position:fixed;bottom:10px;right:10px;background:rgba(0,0,0,0.9);color:#0f0;padding:10px;font-size:10px;z-index:9999;max-height:200px;width:250px;overflow:auto;pointer-events:none;border-radius:8px;border:1px solid #333;font-family:monospace;';
        document.body.appendChild(this.debugEl);
    }

    log(msg, type = 'info') {
        console.log(msg);
        if (this.debugEl) {
            const line = document.createElement('div');
            line.style.color = type === 'error' ? '#f00' : '#0f0';
            line.innerText = `> ${msg}`;
            this.debugEl.appendChild(line);
            this.debugEl.scrollTop = this.debugEl.scrollHeight;
        }
    }

    async handleShareLink() {
        const hash = window.location.hash;
        if (hash.startsWith('#share=')) {
            const payload = hash.replace('#share=', '');
            try {
                const { default: sharing } = await import('./sharing.js');
                await sharing.handleImport(payload);
                // Fix: don't strip the rest of the URL state if we can help it
                history.replaceState(null, document.title, window.location.pathname + window.location.search);
            } catch (err) {
                this.log(`FocusFlow: Share fail: ${err.message}`, 'error');
            }
        }
    }

    async route() {
        const hash = window.location.hash || '#dashboard';
        const viewName = hash.startsWith('#') ? hash.split('=')[0].substring(1) : 'dashboard';
        
        const validViews = ['dashboard', 'list', 'kanban', 'eisenhower', 'calendar', 'reports', 'settings'];
        const targetView = validViews.includes(viewName) ? viewName : 'dashboard';

        this.log(`FocusFlow: Nav to "${targetView}"`);

        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === targetView);
        });

        await this.loadView(targetView);
    }

    async loadView(name) {
        const container = document.getElementById('view-container');
        if (!container) return;
        
        container.innerHTML = `<div style="padding: 20px; color: var(--text-dim);">Loading ${name}...</div>`;
        
        try {
            // Use root-relative path for reliability on GitHub Pages
            const modulePath = `${this.basePath}js/views/${name}.js`;
            this.log(`FocusFlow: Importing ${modulePath}`);
            const module = await import(modulePath);
            
            if (this.currentView && this.currentView.destroy) {
                this.currentView.destroy();
            }
            
            this.currentView = new module.default();
            const viewEl = await this.currentView.render();
            
            if (viewEl instanceof HTMLElement) {
                container.innerHTML = '';
                container.appendChild(viewEl);
                this.initLucide();
                this.log(`FocusFlow: ${name} rendered.`);
            } else {
                this.log(`FocusFlow: ${name} render() didn't return element`, 'error');
            }
        } catch (err) {
            this.log(`FocusFlow: ${name} Error: ${err.message}`, 'error');
            container.innerHTML = `
                <div class="card" style="border-top: 4px solid var(--accent-danger);">
                    <h2>Load Error</h2>
                    <p class="text-muted">${err.message}</p>
                    <p style="font-size:10px;color:var(--text-dim);">${err.stack}</p>
                </div>
            `;
        }
    }

    initLucide() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    initNavigation() {
        document.querySelectorAll('.nav-item').forEach(el => {
            el.onclick = () => {
                const view = el.dataset.view;
                if (view) window.location.hash = view;
            };
        });
    }

    on(event, callback) { this.eventBus.addEventListener(event, callback); }
    emit(event, detail) { this.eventBus.dispatchEvent(new CustomEvent(event, { detail })); }
}

window.app = new App();
window.app.init();
export default window.app;
