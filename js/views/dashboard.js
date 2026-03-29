/**
 * js/views/dashboard.js - Dashboard View
 * Displays stats, today's tasks, and active focus session.
 */

import data from '../data.js';
import taskUI from '../tasks-ui.js';
import taskForm from '../tasks-form.js';

export default class DashboardView {
    async render() {
        const container = document.createElement('div');
        container.className = 'view-dashboard';
        
        const { personal, shared } = data.getAllTasks();
        const allTasks = [...Object.values(personal), ...Object.values(shared)];
        const todayTasks = allTasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
        
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                <h1>Good Morning</h1>
                <button class="btn btn-primary" id="add-task-btn">
                    <i data-lucide="plus"></i> New Task
                </button>
            </div>

            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px;">
                <div class="card stat-card">
                    <span class="form-label">Active Tasks</span>
                    <h2>${todayTasks.length}</h2>
                </div>
                <div class="card stat-card">
                    <span class="form-label">Done Today</span>
                    <h2>${allTasks.filter(t => t.status === 'done').length}</h2>
                </div>
                <div class="card stat-card">
                    <span class="form-label">Streak</span>
                    <h2>3 Days</h2>
                </div>
            </div>

            <div class="dashboard-main" style="display: grid; grid-template-columns: 2fr 1fr; gap: 32px;">
                <section>
                    <h3>Today's Focus</h3>
                    <div id="today-list" class="task-list" style="margin-top: 16px;">
                        ${todayTasks.length === 0 ? '<p class="text-dim">No tasks for today. Add one to get started!</p>' : ''}
                    </div>
                </section>
                
                <section>
                    <div class="card planning-card">
                        <h3>Daily Planning</h3>
                        <p class="text-muted" style="margin: 8px 0 16px;">Review your goals for today.</p>
                        <button class="btn btn-secondary w-full" id="open-planning-btn">
                            <i data-lucide="calendar-check"></i> Plan Day
                        </button>
                    </div>
                </section>
            </div>
        `;

        const todayList = container.querySelector('#today-list');
        todayTasks.forEach(task => {
            todayList.appendChild(taskUI.renderCard(task));
        });

        this.bindEvents(container);
        return container;
    }

    bindEvents(container) {
        container.querySelector('#add-task-btn').addEventListener('click', () => taskForm.open());
        container.querySelector('#open-planning-btn').addEventListener('click', () => {
            window.app.emit('openPlanning');
        });
    }

    destroy() {
        // Cleanup listeners if necessary
    }
}
