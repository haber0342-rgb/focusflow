/**
 * js/views/eisenhower.js - Eisenhower Matrix View
 * 2x2 grid (Urgent/Important) with drag-and-drop.
 */

import data from '../data.js';
import taskUI from '../tasks-ui.js';

export default class EisenhowerView {
    constructor() {
        this.sortables = [];
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'view-eisenhower';
        
        container.innerHTML = `
            <h1 style="margin-bottom: 24px;">Eisenhower Matrix</h1>
            <div class="eisenhower-grid">
                <div class="quadrant q1">
                    <div class="quadrant-header">
                        <span>Urgent + Important</span>
                        <kbd>Q1</kbd>
                    </div>
                    <div id="q1-list" class="quadrant-list" data-quadrant="1"></div>
                </div>
                <div class="quadrant q2">
                    <div class="quadrant-header">
                        <span>Not Urgent + Important</span>
                        <kbd>Q2</kbd>
                    </div>
                    <div id="q2-list" class="quadrant-list" data-quadrant="2"></div>
                </div>
                <div class="quadrant q3">
                    <div class="quadrant-header">
                        <span>Urgent + Not Important</span>
                        <kbd>Q3</kbd>
                    </div>
                    <div id="q3-list" class="quadrant-list" data-quadrant="3"></div>
                </div>
                <div class="quadrant q4">
                    <div class="quadrant-header">
                        <span>Not Urgent + Not Important</span>
                        <kbd>Q4</kbd>
                    </div>
                    <div id="q4-list" class="quadrant-list" data-quadrant="4"></div>
                </div>
            </div>
        `;

        this.populateMatrix(container);
        this.initSortable(container);
        return container;
    }

    populateMatrix(container) {
        const { personal, shared } = data.getAllTasks();
        const allTasks = [...Object.values(personal), ...Object.values(shared)];
        
        const q1 = container.querySelector('#q1-list');
        const q2 = container.querySelector('#q2-list');
        const q3 = container.querySelector('#q3-list');
        const q4 = container.querySelector('#q4-list');

        allTasks.forEach(task => {
            if (task.status === 'done' || task.status === 'archived') return;
            
            const card = taskUI.renderCard(task);
            if (task.quadrant === 1) q1.appendChild(card);
            else if (task.quadrant === 2) q2.appendChild(card);
            else if (task.quadrant === 3) q3.appendChild(card);
            else if (task.quadrant === 4) q4.appendChild(card);
        });
    }

    initSortable(container) {
        if (!window.Sortable) return;

        const lists = container.querySelectorAll('.quadrant-list');
        lists.forEach(list => {
            const sortable = new window.Sortable(list, {
                group: 'eisenhower',
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: (evt) => {
                    const taskId = evt.item.dataset.id;
                    const newQuadrant = parseInt(evt.to.dataset.quadrant);
                    const task = data.getTask(taskId);
                    
                    if (task && task.quadrant !== newQuadrant) {
                        task.quadrant = newQuadrant;
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
