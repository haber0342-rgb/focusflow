/**
 * js/views/list.js - Flat List View
 * Displays all tasks in a filterable/sortable list.
 */

import data from '../data.js';
import taskUI from '../tasks-ui.js';

export default class ListView {
    async render() {
        const container = document.createElement('div');
        container.className = 'view-list';
        
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h1>All Tasks</h1>
                <div class="list-filters" style="display: flex; gap: 12px;">
                    <select id="filter-status" class="form-control">
                        <option value="all">All Status</option>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            <div id="task-list-container" class="task-list"></div>
        `;

        this.updateList(container);
        this.bindEvents(container);
        return container;
    }

    updateList(container) {
        const listEl = container.querySelector('#task-list-container');
        const filterStatus = container.querySelector('#filter-status').value;
        
        listEl.innerHTML = '';
        const { personal, shared } = data.getAllTasks();
        const allTasks = [...Object.values(personal), ...Object.values(shared)];
        
        const filteredTasks = allTasks.filter(t => {
            if (filterStatus !== 'all' && t.status !== filterStatus) return false;
            return true;
        });

        if (filteredTasks.length === 0) {
            listEl.innerHTML = '<p class="text-dim">No tasks found matching your filters.</p>';
            return;
        }

        filteredTasks.forEach(task => {
            listEl.appendChild(taskUI.renderCard(task));
        });
    }

    bindEvents(container) {
        container.querySelector('#filter-status').addEventListener('change', () => this.updateList(container));
    }
}
