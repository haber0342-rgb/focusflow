// js/app.js - Main Entry Point
import data from './data.js';

class App {
    constructor() {
        this.currentView = null;
        this.eventBus = document.createElement('div');
        this.debugEl = null;
        
        // Detect the root of the app relative to origin (e.g. /focusflow/)
        let path = window.location.pathname;
        this.basePath = path.substring(0, path.lastIndexOf('/') + 1);
        if (!this.basePath.startsWith('/')) this.basePath = '/' + this.basePath;
    }

    async init() {
        this.setupDebugUI();
        this.log(`FocusFlow: Init at ${this.basePath}`);
        
        try {
            // 1. Core Modules (Using full absolute paths for reliability)
            const modules = ['notifications.js', 'shortcuts.js', 'planning.js', 'focus.js'];
            for (const name of modules) {
                const path = `${this.basePath}js/${name}`;
                try {
                    await import(path);
                    this.log(`Loaded: ${name}`);
                } catch (e) {
                    this.log(`Error loading ${name}: ${e.message}`, 'error');
                }
            }

            // 2. Data Initialization
            data.initRollover();
            this.log('Data: Ready');

            // 3. UI Setup
            this.initLucide();
            this.initNavigation();
            
            // 4. Router
            window.addEventListener('hashchange', () => this.route());
            await this.route();

            this.log('Status: Running');
        } catch (err) {
            this.log(`FATAL: ${err.message}`, 'error');
            console.error(err);
        }
    }

    setupDebugUI() {
        this.debugEl = document.createElement('div');
        this.debugEl.style.cssText = 'position:fixed;bottom:5px;right:5px;background:#000;color:#0f0;padding:8px;font-size:9px;z-index:99999;width:200px;border:1px solid #333;font-family:monospace;opacity:0.8;';
        document.body.appendChild(this.debugEl);
    }

    log(msg, type = 'info') {
        if (!this.debugEl) return;
        const line = document.createElement('div');
        if (type === 'error') line.style.color = '#f55';
        line.innerText = `> ${msg}`;
        this.debugEl.appendChild(line);
    }

    async route() {
        let hash = window.location.hash || '#dashboard';
        if (hash.includes('=')) hash = hash.split('=')[0]; // Handle #share=
        const viewName = hash.substring(1) || 'dashboard';
        
        this.log(`Nav: ${viewName}`);
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === viewName);
        });

        await this.loadView(viewName);
    }

    async loadView(name) {
        const container = document.getElementById('view-container');
        if (!container) return;
        
        container.innerHTML = `<div style="padding:20px;color:#aaa;">Loading ${name}...</div>`;
        
        try {
            const modulePath = `${this.basePath}js/views/${name}.js`;
            const module = await import(modulePath);
            
            if (this.currentView && this.currentView.destroy) this.currentView.destroy();
            this.currentView = new module.default();
            
            const viewEl = await this.currentView.render();
            container.innerHTML = '';
            container.appendChild(viewEl);
            this.initLucide();
        } catch (err) {
            this.log(`View Error (${name}): ${err.message}`, 'error');
            container.innerHTML = `<div class="card"><h2>Load Error</h2><p>${err.message}</p></div>`;
        }
    }

    initLucide() { if (window.lucide) window.lucide.createIcons(); }

    initNavigation() {
        document.querySelectorAll('.nav-item').forEach(el => {
            el.onclick = () => { if (el.dataset.view) window.location.hash = el.dataset.view; };
        });
    }

    on(e, cb) { this.eventBus.addEventListener(e, cb); }
    emit(e, d) { this.eventBus.dispatchEvent(new CustomEvent(e, { detail: d })); }
}

window.app = new App();
window.app.init();
export default window.app;
