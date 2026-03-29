/**
 * js/integrations/google-drive.js - Drive Sync Engine
 * Handles background sync, file picker, and conflict handoff.
 */

import googleAuth from './google-auth.js';
import data from '../data.js';

class GoogleDrive {
    constructor() {
        this.syncDebounceTimer = null;
        this.isSyncing = false;
        this.fileName = 'focusflow-shared.json';
        this.fileId = localStorage.getItem('ff_g_drive_file_id');
        
        this.init();
    }

    init() {
        // Sync triggers
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') this.sync();
        });
        
        window.app.on('dataChanged', (e) => {
            if (e.detail.type === 'shared') this.scheduleSync();
        });
    }

    scheduleSync() {
        if (this.syncDebounceTimer) clearTimeout(this.syncDebounceTimer);
        this.syncDebounceTimer = setTimeout(() => this.sync(), 60000); // 60s debounce
    }

    async sync() {
        if (!window.googleConnected || this.isSyncing) return;
        this.isSyncing = true;
        this.setSyncStatus('syncing');

        try {
            const token = await googleAuth.getValidToken();
            if (!token) return;

            // 1. Find or Create file
            if (!this.fileId) this.fileId = await this.findFile(token);
            if (!this.fileId) this.fileId = await this.createFile(token);

            // 2. Pull remote
            const remote = await this.getFileContent(this.fileId, token);
            
            // 3. Conflict Detection
            const { personal, shared: localShared } = data.getAllTasks();
            const conflicts = this.detectConflicts(localShared, remote.tasks || {});

            if (conflicts.length > 0) {
                this.setSyncStatus('conflict');
                // Handoff to sharing.js for UI
                const { default: sharing } = await import('../sharing.js');
                const resolved = await sharing.resolveConflicts(conflicts);
                // Merge resolved back into local
                Object.assign(localShared, resolved);
                data.set('shared', localShared);
            } else {
                // No conflicts, merge new remote tasks
                Object.assign(localShared, remote.tasks || {});
                data.set('shared', localShared);
            }

            // 4. Push local to remote
            await this.updateFile(this.fileId, { tasks: localShared }, token);

            this.setSyncStatus('synced');
        } catch (err) {
            console.error('GoogleDrive: Sync failed', err);
            this.setSyncStatus('error');
        } finally {
            this.isSyncing = false;
        }
    }

    async findFile(token) {
        const resp = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${this.fileName}' and trashed=false`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await resp.json();
        if (result.files && result.files.length > 0) {
            localStorage.setItem('ff_g_drive_file_id', result.files[0].id);
            return result.files[0].id;
        }
        return null;
    }

    async createFile(token) {
        const metadata = { name: this.fileName, mimeType: 'application/json' };
        const resp = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });
        const result = await resp.json();
        localStorage.setItem('ff_g_drive_file_id', result.id);
        return result.id;
    }

    async getFileContent(fileId, token) {
        const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return await resp.json();
    }

    async updateFile(fileId, content, token) {
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(content)
        });
    }

    detectConflicts(local, remote) {
        const conflicts = [];
        Object.keys(remote).forEach(id => {
            if (local[id] && JSON.stringify(local[id]) !== JSON.stringify(remote[id])) {
                conflicts.push({ local: local[id], remote: remote[id] });
            }
        });
        return conflicts;
    }

    setSyncStatus(status) {
        const indicator = document.getElementById('sync-status');
        if (!indicator) return;
        indicator.className = `sync-indicator ${status}`;
        indicator.title = `Sync Status: ${status.toUpperCase()}`;
    }

    /**
     * Opens Google Picker to browse/import existing FocusFlow JSON files.
     */
    async openPicker() {
        const token = await googleAuth.getValidToken();
        const apiKey = localStorage.getItem('ff_settings_google_api_key');
        
        if (!token || !apiKey) {
            window.app.emit('notify', { message: 'Google Auth or API Key missing.', type: 'error' });
            return;
        }

        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes('application/json');

        const picker = new google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(token)
            .setDeveloperKey(apiKey)
            .setCallback(async (data) => {
                if (data.action === google.picker.Action.PICKED) {
                    const fileId = data.docs[0].id;
                    const content = await this.getFileContent(fileId, token);
                    // Process import...
                }
            })
            .build();
        picker.setVisible(true);
    }
}

const googleDrive = new GoogleDrive();
export default googleDrive;
