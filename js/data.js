/**
 * js/data.js - Storage and Data Engine
 * Handles namespaced localStorage, CRUD, and Rollover logic.
 */

class DataManager {
    constructor() {
        this.DB_PREFIX = 'ff_';
        this.activeUserId = localStorage.getItem(`${this.DB_PREFIX}active_user`) || 'default';
        this.undoStack = null; // Single-level in-memory undo
    }

    // --- Namespace Helpers ---

    getStoreKey(type, userId = this.activeUserId) {
        if (type === 'shared') return `${this.DB_PREFIX}tasks_shared`;
        if (type === 'users') return `${this.DB_PREFIX}users`;
        if (type === 'active_user') return `${this.DB_PREFIX}active_user`;
        return `${this.DB_PREFIX}${type}_${userId}`;
    }

    get(keyType, userId = this.activeUserId) {
        const key = this.getStoreKey(keyType, userId);
        const raw = localStorage.getItem(key);
        const isTaskStore = keyType.includes('tasks') || keyType === 'shared';
        
        try {
            const parsed = raw ? JSON.parse(raw) : null;
            // If parsed is null or not an object (for task stores), return fallback
            if (isTaskStore) return (parsed && typeof parsed === 'object') ? parsed : {};
            return parsed;
        } catch (e) {
            console.error(`Data: Error parsing ${key}`, e);
            return isTaskStore ? {} : null;
        }
    }

    set(keyType, data, userId = this.activeUserId) {
        const key = this.getStoreKey(keyType, userId);
        localStorage.setItem(key, JSON.stringify(data));
    }

    // --- Task CRUD ---

    saveTask(task, isShared = false) {
        const storeType = isShared ? 'shared' : 'tasks';
        const tasks = this.get(storeType);
        
        // If updating an existing task, check for status change for undo
        if (tasks[task.id]) {
            const oldStatus = tasks[task.id].status;
            if (oldStatus !== task.status) {
                this.undoStack = { taskId: task.id, oldStatus, storeType };
            }
        }

        tasks[task.id] = {
            ...tasks[task.id],
            ...task,
            updated: new Date().toISOString()
        };
        
        this.set(storeType, tasks);
        window.app.emit('dataChanged', { type: storeType, task });
    }

    deleteTask(taskId, isShared = false) {
        const storeType = isShared ? 'shared' : 'tasks';
        const tasks = this.get(storeType);
        delete tasks[taskId];
        this.set(storeType, tasks);
        window.app.emit('dataChanged', { type: storeType, taskId, deleted: true });
    }

    getTask(taskId) {
        const personal = this.get('tasks');
        if (personal[taskId]) return personal[taskId];
        const shared = this.get('shared');
        return shared[taskId] || null;
    }

    getAllTasks() {
        const personal = this.get('tasks');
        const shared = this.get('shared');
        
        // Add a welcome task if empty
        if (Object.keys(personal).length === 0 && Object.keys(shared).length === 0) {
            const welcomeTask = {
                id: 'welcome',
                text: 'Welcome to FocusFlow! Click the play button to start focusing.',
                priority: 'Medium',
                status: 'todo',
                quadrant: 2,
                created: new Date().toISOString(),
                notes: 'This is a sample task to get you started.'
            };
            personal['welcome'] = welcomeTask;
            this.set('tasks', personal);
        }

        return { personal, shared };
    }

    // --- Rollover Logic ---

    initRollover() {
        // 1. Check on load
        this.checkRolloverOnLoad();
        
        // 2. Schedule live midnight rollover
        this.scheduleMidnightRollover();
    }

    checkRolloverOnLoad() {
        const lastRollover = localStorage.getItem(`${this.DB_PREFIX}last_rollover`);
        const today = new Date().toISOString().split('T')[0];
        
        if (lastRollover !== today) {
            console.log('Data: Running morning rollover...');
            this.runRollover();
            localStorage.setItem(`${this.DB_PREFIX}last_rollover`, today);
        }
    }

    scheduleMidnightRollover() {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const msUntilMidnight = tomorrow - now;
        
        setTimeout(() => {
            console.log('Data: Midnight reached. Running rollover...');
            this.runRollover();
            localStorage.setItem(`${this.DB_PREFIX}last_rollover`, new Date().toISOString().split('T')[0]);
            this.scheduleMidnightRollover(); // Re-register for next night
        }, msUntilMidnight);
    }

    runRollover() {
        const { personal, shared } = this.getAllTasks();
        const todayStr = new Date().toISOString().split('T')[0];

        const processTasks = (taskMap, storeType) => {
            let changed = false;
            Object.values(taskMap).forEach(task => {
                if (task.status === 'done' || task.status === 'archived') return;
                
                // Recurring logic
                if (task.recurring && task.recurring !== 'none') {
                    this.advanceRecurringTask(task);
                    changed = true;
                    return;
                }

                // Normal rollover behavior evaluation
                const createdDate = new Date(task.created || Date.now());
                const daysOld = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
                
                if (task.rollover === 'stop_n' && task.rolloverCount >= task.rolloverLimit) {
                    task.status = 'archived';
                    task.notes = (task.notes || '') + `\n\n[Auto-archived: Rollover limit ${task.rolloverLimit} reached on ${todayStr}]`;
                } else if (task.rollover === 'archive_n' && task.status === 'todo' && daysOld >= task.rolloverLimit) {
                    task.status = 'archived';
                    task.notes = (task.notes || '') + `\n\n[Auto-archived: Not started within ${task.rolloverLimit} days]`;
                } else {
                    // Indefinite or within limits -> roll over
                    task.rolloverCount = (task.rolloverCount || 0) + 1;
                    task.rolloverDate = todayStr;
                    // Add visual indicator if not already present
                    const indicator = `Rolled over from ${task.lastActiveDate || 'yesterday'}`;
                    task.lastActiveDate = todayStr;
                }
                changed = true;
            });
            if (changed) this.set(storeType, taskMap);
        };

        processTasks(personal, 'tasks');
        processTasks(shared, 'shared');
        
        window.app.emit('rolloverComplete');
    }

    advanceRecurringTask(task) {
        const today = new Date();
        const interval = task.recurring; // daily, weekly, monthly
        let nextDate = new Date(task.dueDate || today);

        if (interval === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        else if (interval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (interval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);

        task.status = 'todo';
        task.dueDate = nextDate.toISOString().split('T')[0];
        task.subtasks?.forEach(s => s.done = false);
        task.notes = (task.notes || '') + `\n\n[Rolled over from ${new Date().toLocaleDateString()}]`;
    }

    // --- Export / Import ---

    exportData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.DB_PREFIX)) {
                data[key] = localStorage.getItem(key);
            }
        }
        return JSON.stringify(data, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            Object.keys(data).forEach(key => {
                if (key.startsWith(this.DB_PREFIX)) {
                    localStorage.setItem(key, data[key]);
                }
            });
            return true;
        } catch (e) {
            console.error('Data: Import failed', e);
            return false;
        }
    }
}

const dataManager = new DataManager();
export default dataManager;
