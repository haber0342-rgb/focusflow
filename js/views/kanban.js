/**
 * js/views/kanban.js - Kanban Board View
 * Three columns (To Do, In Progress, Done) with drag-and-drop.
 */

import data from '../data.js';
import taskUI from '../tasks-ui.js';

export default class KanbanView {
    constructor() {
        this.sortables = [];
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'view-kanban';
        
        container.innerHTML = `
            <h1 style="margin-bottom: 24px;">Kanban Board</h1>
            <div class="kanban-board" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; min-height: 500px;">
                <div class="kanban-column">
                    <h3>To Do</h3>
                    <div id="kanban-todo" class="kanban-list" data-status="todo"></div>
                </div>
                <div class="kanban-column">
                    <h3>In Progress</h3>
                    <div id="kanban-progress" class="kanban-list" data-status="in_progress"></div>
                </div>
                <div class="kanban-column">
                    <h3>Done</h3>
                    <div id="kanban-done" class="kanban-list" data-status="done"></div>
                </div>
            </div>
        `;

        this.populateBoard(container);
        this.initSortable(container);
        return container;
    }

    populateBoard(container) {
        const { personal, shared } = data.getAllTasks();
        const allTasks = [...Object.values(personal), ...Object.values(shared)];
        
        const todoList = container.querySelector('#kanban-todo');
        const progressList = container.querySelector('#kanban-progress');
        const doneList = container.querySelector('#kanban-done');

        allTasks.forEach(task => {
            const card = taskUI.renderCard(task);
            if (task.status === 'todo') todoList.appendChild(card);
            else if (task.status === 'in_progress') progressList.appendChild(card);
            else if (task.status === 'done') doneList.appendChild(card);
        });
    }

    initSortable(container) {
        if (!window.Sortable) return;

        const lists = container.querySelectorAll('.kanban-list');
        lists.forEach(list => {
            const sortable = new window.Sortable(list, {
                group: 'kanban',
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: (evt) => {
                    const taskId = evt.item.dataset.id;
                    const newStatus = evt.to.dataset.status;
                    const task = data.getTask(taskId);
                    
                    if (task && task.status !== newStatus) {
                        task.status = newStatus;
                        data.saveTask(task, task.shared);
                    }
                }
            });
            this.sortables.push(sortable);
        });
    }

    destroy() {
        this.sortables.forEach(s => s.destroy());
    }
}
