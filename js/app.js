// js/app.js - Main Entry Point
import data from './data.js';

class App {
    constructor() {
        this.currentView = null;
        this.eventBus = document.createElement('div');
        this.debugEl = null;
    }

    async init() {
        this.setupDebugUI();
        this.log('FocusFlow: Booting...');
        
        try {
            // 1. Core Controllers (Relative to this file)
            const coreModules = ['notifications.js', 'shortcuts.js', 'planning.js', 'focus.js'];
            for (const name of coreModules) {
                try {
                    await import(`./${name}`);
                    this.log(`Loaded ${name}`);
                } catch (e) {
                    this.log(`Fail ${name}: ${e.message}`, 'error');
                }
            }

            // 2. Data Logic
            data.initRollover();
            this.log('Data: Ready');

            // 3. UI and Routing
            this.initLucide();
            this.initNavigation();
            
            window.addEventListener('hashchange', () => this.route());
            await this.route();

            this.log('Status: All systems go');
        } catch (err) {
            this.log(`FATAL: ${err.message}`, 'error');
        }
    }

    setupDebugUI() {
        this.debugEl = document.createElement('div');
        this.debugEl.style.cssText = 'position:fixed;bottom:5px;right:5px;background:rgba(0,0,0,0.8);color:#0f0;padding:8px;font-size:9px;z-index:99999;width:180px;border:1px solid #333;font-family:monospace;pointer-events:none;';
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
        const viewName = hash.split('=')[0].substring(1) || 'dashboard';
        
        this.log(`Nav: ${viewName}`);
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === viewName);
        });

        await this.loadView(viewName);
    }

    async loadView(name) {
        const container = document.getElementById('view-container');
        if (!container) return;
        
        container.innerHTML = `<div style="padding:20px;color:#888;">Loading ${name}...</div>`;
        
        try {
            // Pure relative path from js/app.js to js/views/
            const module = await import(`./views/${name}.js`);
            
            if (this.currentView && this.currentView.destroy) this.currentView.destroy();
            this.currentView = new module.default();
            
            const viewEl = await this.currentView.render();
            if (viewEl instanceof HTMLElement) {
                container.innerHTML = '';
                container.appendChild(viewEl);
                this.initLucide();
                this.log(`Rendered: ${name}`);
            }
        } catch (err) {
            this.log(`View Error: ${err.message}`, 'error');
            container.innerHTML = `<div class="card" style="border-top:4px solid #f55;"><h2>Load Error</h2><p>${err.message}</p></div>`;
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
