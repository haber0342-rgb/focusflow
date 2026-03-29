/**
 * js/notifications.js - Notification System
 * Handles in-app toasts, browser push notifications, and sound alerts.
 */

class NotificationManager {
    constructor() {
        this.toastContainer = document.getElementById('toast-container');
        this.audioCtx = null;
        this.init();
    }

    init() {
        window.app.on('notify', (e) => this.toast(e.detail.message, e.detail.type));
        
        // Request browser notification permission on first interaction
        window.addEventListener('click', () => {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }, { once: true });
    }

    /**
     * Shows a non-blocking toast notification.
     */
    toast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <i data-lucide="${this.getIconForType(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        this.toastContainer.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        // Auto-remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    getIconForType(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'alert-circle';
            case 'warning': return 'alert-triangle';
            default: return 'info';
        }
    }

    /**
     * Sends a browser push notification (if permitted).
     */
    push(title, options = {}) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                icon: 'FF_ICON_DATA_URI', // Placeholder
                ...options
            });
        }
    }

    /**
     * Plays a procedural chime using Web Audio API.
     */
    playChime() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.5); // A4

        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.5);
    }
}

const notificationManager = new NotificationManager();
export default notificationManager;
