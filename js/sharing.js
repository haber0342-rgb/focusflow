/**
 * js/sharing.js - Sharing and Conflict Resolution
 * Handles URL-based sharing (LZString) and sync conflict UI.
 */

import data from './data.js';
import taskUI from './tasks-ui.js';

class SharingManager {
    constructor() {
        this.conflictBanner = document.getElementById('conflict-banner');
        this.conflictQueue = [];
        this.resolvePromise = null;
    }

    /**
     * Generates a shareable URL for selected tasks.
     */
    generateShareLink(tasks) {
        const json = JSON.stringify(tasks);
        const compressed = window.LZString.compressToEncodedURIComponent(json);
        const url = `${window.location.origin}${window.location.pathname}#share=${compressed}`;
        
        if (url.length > 4000) {
            window.app.emit('notify', { message: 'Link too long for some apps. Consider Drive sync.', type: 'warning' });
        }
        
        return url;
    }

    /**
     * Processes an incoming #share= payload.
     */
    async handleImport(payload) {
        try {
            const json = window.LZString.decompressFromEncodedURIComponent(payload);
            const incomingTasks = JSON.parse(json);
            
            const { personal, shared } = data.getAllTasks();
            const localTasks = { ...personal, ...shared };
            
            const conflicts = [];
            const toImport = {};

            Object.values(incomingTasks).forEach(incoming => {
                const local = localTasks[incoming.id];
                if (local && JSON.stringify(local) !== JSON.stringify(incoming)) {
                    conflicts.push({ local, incoming });
                } else {
                    toImport[incoming.id] = incoming;
                }
            });

            // 1. Silent Import
            Object.values(toImport).forEach(t => data.saveTask(t, true));

            // 2. Resolve Conflicts
            if (conflicts.length > 0) {
                await this.resolveConflicts(conflicts);
            }

            window.app.emit('notify', { message: 'Import complete!', type: 'success' });
        } catch (err) {
            console.error('Sharing: Import failed', err);
            window.app.emit('notify', { message: 'Invalid share link.', type: 'error' });
        }
    }

    /**
     * Side-by-side Conflict Resolution UI
     */
    async resolveConflicts(conflicts) {
        this.conflictQueue = conflicts;
        this.conflictBanner.classList.remove('hidden');
        
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            this.renderNextConflict();
        });
    }

    renderNextConflict() {
        if (this.conflictQueue.length === 0) {
            this.conflictBanner.classList.add('hidden');
            this.resolvePromise({}); // Signal completion
            return;
        }

        const { local, incoming } = this.conflictQueue[0];
        
        this.conflictBanner.innerHTML = `
            <div class="card" style="max-width: 900px; margin: 20px auto; border-top: 4px solid var(--accent-secondary);">
                <h3>Data Conflict Detected</h3>
                <p class="text-muted">An incoming task has different values than your local copy.</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                    <div class="conflict-side">
                        <div class="form-label">LOCAL COPY</div>
                        <div id="local-preview"></div>
                        <button class="btn btn-secondary w-full" id="keep-mine" style="margin-top: 12px;">Keep Mine</button>
                    </div>
                    <div class="conflict-side">
                        <div class="form-label">INCOMING COPY</div>
                        <div id="incoming-preview"></div>
                        <button class="btn btn-primary w-full" id="use-theirs" style="margin-top: 12px;">Use Theirs</button>
                    </div>
                </div>
            </div>
        `;

        this.conflictBanner.querySelector('#local-preview').appendChild(taskUI.renderCard(local));
        this.conflictBanner.querySelector('#incoming-preview').appendChild(taskUI.renderCard(incoming));

        this.conflictBanner.querySelector('#keep-mine').onclick = () => this.resolveCurrent(local);
        this.conflictBanner.querySelector('#use-theirs').onclick = () => this.resolveCurrent(incoming);
    }

    resolveCurrent(resolvedTask) {
        data.saveTask(resolvedTask, true);
        this.conflictQueue.shift();
        this.renderNextConflict();
    }
}

const sharingManager = new SharingManager();
export default sharingManager;
