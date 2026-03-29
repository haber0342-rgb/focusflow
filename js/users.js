/**
 * js/users.js - User Profile Management
 * Handles local user profiles and namespacing.
 */

class UserManager {
    constructor() {
        this.DB_PREFIX = 'ff_';
        this.users = this.loadUsers();
        this.activeUser = this.loadActiveUser();
    }

    loadUsers() {
        const data = localStorage.getItem(`${this.DB_PREFIX}users`);
        return data ? JSON.parse(data) : { 'default': { name: 'FocusFlow User', color: '#6c63ff' } };
    }

    loadActiveUser() {
        return localStorage.getItem(`${this.DB_PREFIX}active_user`) || 'default';
    }

    saveUser(id, profile) {
        this.users[id] = profile;
        localStorage.setItem(`${this.DB_PREFIX}users`, JSON.stringify(this.users));
        window.app.emit('userChanged', { id, profile });
    }

    switchUser(id) {
        if (this.users[id]) {
            this.activeUser = id;
            localStorage.setItem(`${this.DB_PREFIX}active_user`, id);
            window.location.reload(); // Reload to refresh all namespaced storage
        }
    }

    getActiveProfile() {
        return this.users[this.activeUser];
    }
}

const userManager = new UserManager();
export default userManager;
