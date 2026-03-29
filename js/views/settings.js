/**
 * js/views/settings.js - Settings View
 * Manages user profile, integrations, and data operations.
 */

import data from '../data.js';
import userManager from '../users.js';
import googleAuth from '../integrations/google-auth.js';

export default class SettingsView {
    async render() {
        const container = document.createElement('div');
        container.className = 'view-settings';
        
        const profile = userManager.getActiveProfile();
        
        container.innerHTML = `
            <h1 style="margin-bottom: 32px;">Settings</h1>

            <section class="card">
                <h3>User Profile</h3>
                <div class="form-group" style="margin-top: 16px;">
                    <label class="form-label">Display Name</label>
                    <input type="text" id="set-user-name" class="form-control" value="${profile.name}">
                </div>
                <button class="btn btn-primary" id="save-profile-btn">Save Profile</button>
            </section>

            <section class="card">
                <h3>Integrations</h3>
                <div class="form-group" style="margin-top: 16px;">
                    <label class="form-label">Google OAuth Client ID</label>
                    <input type="text" id="set-google-client" class="form-control" value="${localStorage.getItem('ff_settings_google_client_id') || ''}" placeholder="...apps.googleusercontent.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Google Browser API Key (for Picker)</label>
                    <input type="password" id="set-google-api" class="form-control" value="${localStorage.getItem('ff_settings_google_api_key') || ''}">
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-secondary" id="google-connect-btn">
                        ${window.googleConnected ? 'Disconnect Google' : 'Connect Google'}
                    </button>
                </div>

                <div class="form-group" style="margin-top: 24px;">
                    <label class="form-label">Gemini API Key</label>
                    <input type="password" id="set-gemini-key" class="form-control" value="${localStorage.getItem('ff_settings_gemini_api_key') || ''}">
                </div>
                <button class="btn btn-primary" id="save-keys-btn">Save API Keys</button>
            </section>

            <section class="card">
                <h3>Data Management</h3>
                <p class="text-muted" style="margin-bottom: 16px;">Export or import your local FocusFlow data.</p>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-secondary" id="export-data-btn">Export JSON</button>
                    <button class="btn btn-secondary" id="import-data-btn">Import JSON</button>
                </div>
            </section>
        `;

        this.bindEvents(container);
        return container;
    }

    bindEvents(container) {
        container.querySelector('#save-profile-btn').onclick = () => {
            const name = document.getElementById('set-user-name').value;
            userManager.saveUser(userManager.activeUser, { name, color: '#6c63ff' });
            window.app.emit('notify', { message: 'Profile saved!', type: 'success' });
        };

        container.querySelector('#save-keys-btn').onclick = () => {
            localStorage.setItem('ff_settings_google_client_id', document.getElementById('set-google-client').value);
            localStorage.setItem('ff_settings_google_api_key', document.getElementById('set-google-api').value);
            localStorage.setItem('ff_settings_gemini_api_key', document.getElementById('set-gemini-key').value);
            window.app.emit('notify', { message: 'Settings saved!', type: 'success' });
        };

        container.querySelector('#google-connect-btn').onclick = () => {
            if (window.googleConnected) googleAuth.disconnect();
            else googleAuth.connect();
        };

        container.querySelector('#export-data-btn').onclick = () => {
            const json = data.exportData();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `focusflow_export_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        };
    }
}
