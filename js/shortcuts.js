/**
 * js/shortcuts.js - Keyboard Shortcut System
 * Handles global keybindings, input suppression, and single-level undo.
 */

import data from './data.js';

class ShortcutManager {
    constructor() {
        this.shortcuts = [
            { key: 'n', desc: 'New task', action: () => this.trigger('newTask') },
            { key: 'f', desc: 'Start focus mode', action: () => this.trigger('startFocus') },
            { key: 'd', desc: 'Daily planning', action: () => this.trigger('openPlanning') },
            { key: 'r', desc: 'Retrospective', action: () => this.trigger('openRetro') },
            { key: 'e', desc: 'Export data', action: () => this.trigger('exportData') },
            { key: '?', desc: 'Toggle shortcuts help', action: () => this.toggleHelp() },
            { key: '1', desc: 'Dashboard', action: () => window.location.hash = '#dashboard' },
            { key: '2', desc: 'List View', action: () => window.location.hash = '#list' },
            { key: '3', desc: 'Kanban Board', action: () => window.location.hash = '#kanban' },
            { key: '4', desc: 'Eisenhower', action: () => window.location.hash = '#eisenhower' },
            { key: '5', desc: 'Calendar', action: () => window.location.hash = '#calendar' },
            { key: '6', desc: 'Reports', action: () => window.location.hash = '#reports' },
            { key: '7', desc: 'Settings', action: () => window.location.hash = '#settings' }
        ];

        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleKeyDown(e) {
        // 1. Suppress shortcuts when typing in inputs
        if (this.isInputFocused(e)) {
            if (e.key === 'Escape') {
                e.target.blur();
                window.app.emit('closeModals');
            }
            return;
        }

        const key = e.key.toLowerCase();
        const isCtrl = e.ctrlKey || e.metaKey;

        // 2. Undo (Ctrl+Z)
        if (isCtrl && key === 'z') {
            e.preventDefault();
            this.undo();
            return;
        }

        // 3. Space / Tab overrides
        if (key === ' ' && !this.isInputFocused(e)) {
            // Space: Toggle selected task status (if any selected)
            // For now, prevent default only if app handles it
            // e.preventDefault();
        }

        if (key === 'tab' && !this.isInputFocused(e)) {
            // Tab: Cycle tasks
            // e.preventDefault();
        }

        // 4. Primary Shortcuts
        const shortcut = this.shortcuts.find(s => s.key === key);
        if (shortcut) {
            e.preventDefault();
            shortcut.action();
        }
    }

    isInputFocused(e) {
        const tag = e.target.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
    }

    trigger(eventName) {
        window.app.emit(eventName);
    }

    undo() {
        const stack = data.undoStack;
        if (!stack) {
            window.app.emit('notify', { message: 'Nothing to undo', type: 'info' });
            return;
        }

        const tasks = data.get(stack.storeType);
        if (tasks[stack.taskId]) {
            tasks[stack.taskId].status = stack.oldStatus;
            data.set(stack.storeType, tasks);
            data.undoStack = null; // Clear stack after use
            window.app.emit('dataChanged', { type: stack.storeType });
            window.app.emit('notify', { message: 'Action undone', type: 'success' });
        }
    }

    toggleHelp() {
        const helpEl = document.getElementById('keyboard-help');
        if (!helpEl.classList.contains('hidden')) {
            helpEl.classList.add('hidden');
            return;
        }

        helpEl.innerHTML = `
            <div class="modal-content">
                <h2>Keyboard Shortcuts</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                    ${this.shortcuts.map(s => `
                        <div style="display: flex; justify-content: space-between;">
                            <span>${s.desc}</span>
                            <kbd>${s.key.toUpperCase()}</kbd>
                        </div>
                    `).join('')}
                    <div style="display: flex; justify-content: space-between;">
                        <span>Undo last status</span>
                        <kbd>CTRL + Z</kbd>
                    </div>
                </div>
                <button class="btn btn-primary" style="margin-top: 32px; width: 100%;" id="close-shortcuts-btn">Close</button>
            </div>
        `;
        helpEl.querySelector('#close-shortcuts-btn').onclick = () => helpEl.classList.add('hidden');
        helpEl.classList.remove('hidden');
    }
}

const shortcutManager = new ShortcutManager();
export default shortcutManager;
