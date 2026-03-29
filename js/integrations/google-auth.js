/**
 * js/integrations/google-auth.js - Google Identity Services (GIS) Wrapper
 * Handles OAuth 2.0 lifecycle, token refresh, and auth state broadcast.
 */

class GoogleAuth {
    constructor() {
        this.tokenClient = null;
        this.accessToken = localStorage.getItem('ff_g_access_token');
        this.expiresAt = parseInt(localStorage.getItem('ff_g_expires_at')) || 0;
        this.scopes = [
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/drive.readonly'
        ].join(' ');
        
        this.init();
    }

    init() {
        // GIS is loaded via script tag in index.html
        window.addEventListener('load', () => {
            if (window.google) this.initTokenClient();
        });
    }

    initTokenClient() {
        const clientId = this.getClientId();
        if (!clientId) return;

        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: this.scopes,
            callback: (resp) => this.handleTokenResponse(resp),
        });

        // Silent refresh check
        if (this.accessToken && Date.now() < this.expiresAt) {
            this.setAuthState(true);
        } else if (this.accessToken) {
            this.refreshToken(true); // Attempt silent refresh
        }
    }

    getClientId() {
        // Client ID is stored in Settings (localStorage)
        return localStorage.getItem('ff_settings_google_client_id');
    }

    /**
     * Triggers the OAuth popup flow.
     */
    async connect() {
        if (!this.tokenClient) {
            window.app.emit('notify', { message: 'Google Client ID not configured in Settings.', type: 'error' });
            return;
        }
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
    }

    /**
     * Attempts a silent refresh (no popup if session is still valid in browser).
     */
    async refreshToken(silent = false) {
        if (!this.tokenClient) return;
        this.tokenClient.requestAccessToken({ prompt: silent ? '' : 'none' });
    }

    handleTokenResponse(resp) {
        if (resp.error !== undefined) {
            this.handleAuthError(resp);
            return;
        }

        this.accessToken = resp.access_token;
        this.expiresAt = Date.now() + (resp.expires_in * 1000);
        
        localStorage.setItem('ff_g_access_token', this.accessToken);
        localStorage.setItem('ff_g_expires_at', this.expiresAt);
        
        this.setAuthState(true);
        window.app.emit('notify', { message: 'Google account connected!', type: 'success' });
    }

    handleAuthError(resp) {
        console.error('GoogleAuth: Error', resp);
        this.setAuthState(false);
        
        if (resp.error === 'popup_failed_to_open') {
            window.app.emit('notify', { message: 'Browser blocked popup. Please enable popups.', type: 'warning' });
        } else if (resp.error === 'access_denied') {
            window.app.emit('notify', { message: 'Access denied by user.', type: 'error' });
        }
    }

    setAuthState(isConnected) {
        window.googleConnected = isConnected;
        window.app.emit('googleAuthStateChanged', { isConnected });
        
        // Broadcast to specific components via DOM if needed
        const btn = document.getElementById('sync-status');
        if (btn) btn.classList.toggle('connected', isConnected);
    }

    async getValidToken() {
        if (this.accessToken && Date.now() < this.expiresAt - 300000) { // 5 min buffer
            return this.accessToken;
        }
        // Attempt refresh
        await this.refreshToken(true);
        return this.accessToken;
    }

    disconnect() {
        if (this.accessToken) {
            window.google.accounts.oauth2.revoke(this.accessToken, () => {
                localStorage.removeItem('ff_g_access_token');
                localStorage.removeItem('ff_g_expires_at');
                this.accessToken = null;
                this.setAuthState(false);
                window.app.emit('notify', { message: 'Google account disconnected.', type: 'info' });
            });
        }
    }
}

const googleAuth = new GoogleAuth();
export default googleAuth;
