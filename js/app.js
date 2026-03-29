// js/app.js - Main Entry Point
import data from './data.js';

class App {
    constructor() {
        this.currentView = null;
        this.eventBus = document.createElement('div');
    }

    async init() {
        console.log('FocusFlow: Initializing...');
        try {
            // 1. Core Modules (Load after window.app exists)
            console.log('FocusFlow: Loading core modules...');
            const modules = ['./notifications.js', './shortcuts.js', './planning.js', './focus.js'];
            for (const path of modules) {
                try {
                    await import(path);
                    console.log(`FocusFlow: Module "${path}" loaded.`);
                } catch (e) {
                    console.error(`FocusFlow: Failed to load module "${path}":`, e);
                }
            }
            console.log('FocusFlow: Core modules loading process finished.');

            // 2. Initialize Data Rollover
            data.initRollover();

            // 3. #share= interception (Highest Priority)
            await this.handleShareLink();

            // 4. Initialize UI Components
            this.initLucide();
            this.initNavigation();
            
            // 5. Register Router
            window.addEventListener('hashchange', () => this.route());
            
            // 6. Initial Route
            this.route();

            // 7. Register Service Worker
            this.registerServiceWorker();

            console.log('FocusFlow: Initialization complete.');
        } catch (err) {
            console.error('FocusFlow: Initialization failed:', err);
        }
    }

    /**
     * Intercepts #share= fragment before the router fires.
     */
    async handleShareLink() {
        const hash = window.location.hash;
        if (hash.startsWith('#share=')) {
            console.log('FocusFlow: Share link detected.');
            const payload = hash.replace('#share=', '');
            
            try {
                // Dynamically import sharing logic to process the payload
                const { default: sharing } = await import('./sharing.js');
                await sharing.handleImport(payload);
                
                // Clear the fragment from URL without triggering a reload
                history.replaceState(null, document.title, window.location.pathname + window.location.search);
            } catch (err) {
                console.error('FocusFlow: Failed to process share link:', err);
            }
        }
    }

    /**
     * Simple hash-based router.
     */
    async route() {
        const hash = window.location.hash || '#dashboard';
        const viewName = hash.substring(1);
        
        console.log(`FocusFlow: Routing to "${viewName}"`);

        // Update Nav UI
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === viewName);
        });

        // Load View
        try {
            await this.loadView(viewName);
        } catch (err) {
            console.error(`FocusFlow: Failed to load view "${viewName}":`, err);
        }
    }

    async loadView(name) {
        const container = document.getElementById('view-container');
        if (!container) {
            console.error('FocusFlow: #view-container not found!');
            return;
        }
        
        container.innerHTML = '<div class="text-dim">Loading view...</div>';
        console.log(`FocusFlow: Loading view module "./views/${name}.js"`);
        
        try {
            const module = await import(`./views/${name}.js`);
            console.log(`FocusFlow: Module "./views/${name}.js" loaded.`);

            if (this.currentView && this.currentView.destroy) {
                this.currentView.destroy();
            }
            
            this.currentView = new module.default();
            const viewEl = await this.currentView.render();
            
            if (viewEl instanceof HTMLElement) {
                container.innerHTML = '';
                container.appendChild(viewEl);
                this.initLucide();
                console.log(`FocusFlow: View "${name}" rendered.`);
            } else {
                console.error(`FocusFlow: View "${name}" did not return an HTMLElement.`, viewEl);
                container.innerHTML = `<div class="card"><h2>Error</h2><p>View "${name}" failed to render correctly.</p></div>`;
            }
        } catch (err) {
            console.error(`FocusFlow: Failed to load view "${name}":`, err);
            container.innerHTML = `<div class="card"><h2>View "${name}" is under construction.</h2><p class="text-muted">${err.message}</p></div>`;
            throw err;
        }
    }

    initLucide() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    initNavigation() {
        // Handle nav clicks to ensure smooth routing
        document.querySelectorAll('.nav-item').forEach(el => {
            el.addEventListener('click', (e) => {
                // Lucide icons might be the target
                const link = e.target.closest('a');
                if (link && link.getAttribute('href').startsWith('#')) {
                    // Default browser hash change behavior is fine
                }
            });
        });
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => console.log('FocusFlow: SW registered.'))
                    .catch(err => console.error('FocusFlow: SW registration failed.', err));
            });
        }
    }

    // Event Bus Helpers
    on(event, callback) {
        this.eventBus.addEventListener(event, callback);
    }

    emit(event, detail) {
        this.eventBus.dispatchEvent(new CustomEvent(event, { detail }));
    }
}

// Global App Instance
window.app = new App();
window.app.init();

export default window.app;
