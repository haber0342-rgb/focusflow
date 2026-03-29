/**
 * js/planning.js - Daily Planning and Retrospective
 * Manages morning review of rolled-over tasks and evening reflection.
 */

import data from './data.js';
import taskUI from './tasks-ui.js';

class PlanningController {
    constructor() {
        this.overlay = document.getElementById('planning-overlay');
        this.retroOverlay = document.createElement('div');
        this.retroOverlay.className = 'modal hidden';
        document.body.appendChild(this.retroOverlay);
        
        this.init();
    }

    init() {
        window.app.on('openPlanning', () => this.showPlanning());
        window.app.on('openRetro', () => this.showRetrospective());
        window.app.on('rolloverComplete', () => this.showPlanning());
        
        // End-of-day retrospective check
        this.checkRetroTiming();
    }

    checkRetroTiming() {
        const configTime = 17; // 17:00 default
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        if (now.getHours() >= configTime) {
            const lastRetro = localStorage.getItem('ff_last_retro');
            if (lastRetro !== todayStr) {
                this.showRetrospective();
            }
        }
    }

    /**
     * Daily Planning Overlay
     */
    showPlanning() {
        const { personal, shared } = data.getAllTasks();
        const rolledTasks = [...Object.values(personal), ...Object.values(shared)]
            .filter(t => t.rolloverDate === new Date().toISOString().split('T')[0]);

        this.overlay.innerHTML = `
            <div class="modal-content">
                <h2>Daily Planning</h2>
                <p class="text-muted" style="margin-bottom: 24px;">Review your rolled-over tasks and plan for today.</p>
                
                <div id="rolled-task-list" class="task-list">
                    ${rolledTasks.length === 0 ? '<p class="text-dim">No tasks rolled over today.</p>' : ''}
                </div>

                <div style="margin-top: 32px; display: flex; justify-content: flex-end; gap: 12px;">
                    <button class="btn btn-secondary" id="planning-close">Close</button>
                    <button class="btn btn-primary" id="planning-ready">I'm Ready</button>
                </div>
            </div>
        `;

        const listEl = this.overlay.querySelector('#rolled-task-list');
        rolledTasks.forEach(task => {
            const card = taskUI.renderCard(task);
            // Add custom review buttons to each card in planning mode
            const footer = document.createElement('div');
            footer.style.display = 'flex';
            footer.style.gap = '8px';
            footer.style.marginTop = '12px';
            footer.innerHTML = `
                <button class="btn btn-secondary btn-sm" data-action="archive">Archive</button>
                <button class="btn btn-secondary btn-sm" data-action="keep">Keep Today</button>
                <button class="btn btn-secondary btn-sm" data-action="reschedule">Reschedule</button>
            `;
            card.appendChild(footer);
            
            footer.querySelectorAll('button').forEach(btn => {
                btn.onclick = () => {
                    if (btn.dataset.action === 'archive') task.status = 'archived';
                    else if (btn.dataset.action === 'keep') task.rolloverDate = null; // Mark as processed
                    data.saveTask(task, task.shared);
                    card.remove();
                };
            });
            
            listEl.appendChild(card);
        });

        this.overlay.classList.remove('hidden');
        this.overlay.querySelector('#planning-close').onclick = () => this.overlay.classList.add('hidden');
        this.overlay.querySelector('#planning-ready').onclick = () => this.overlay.classList.add('hidden');
    }

    /**
     * End-of-day Retrospective Overlay
     */
    showRetrospective() {
        const { personal, shared } = data.getAllTasks();
        const allTasks = [...Object.values(personal), ...Object.values(shared)];
        const doneToday = allTasks.filter(t => t.status === 'done' && t.updated.split('T')[0] === new Date().toISOString().split('T')[0]);

        this.retroOverlay.innerHTML = `
            <div class="modal-content">
                <h2>End-of-Day Retrospective</h2>
                <div style="margin: 20px 0;">
                    <h3>What did you finish?</h3>
                    <p class="text-muted">${doneToday.length} tasks completed today.</p>
                    <div style="margin-top: 12px;">
                        ${doneToday.map(t => `<div class="text-muted">• ${t.text}</div>`).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Any notes on today?</label>
                    <textarea id="retro-notes" class="form-control" rows="3" placeholder="What went well? What didn't?"></textarea>
                </div>

                <div style="margin-top: 32px; display: flex; justify-content: flex-end; gap: 12px;">
                    <button class="btn btn-secondary" id="retro-skip">Dismiss</button>
                    <button class="btn btn-primary" id="retro-save">Save Log</button>
                </div>
            </div>
        `;

        this.retroOverlay.classList.remove('hidden');
        this.retroOverlay.querySelector('#retro-skip').onclick = () => {
            localStorage.setItem('ff_last_retro', new Date().toISOString().split('T')[0]);
            this.retroOverlay.classList.add('hidden');
        };
        
        this.retroOverlay.querySelector('#retro-save').onclick = () => {
            const notes = document.getElementById('retro-notes').value;
            this.saveDailyLog(notes, doneToday.map(t => t.id));
            localStorage.setItem('ff_last_retro', new Date().toISOString().split('T')[0]);
            this.retroOverlay.classList.add('hidden');
        };
    }

    saveDailyLog(notes, completedTaskIds) {
        const today = new Date().toISOString().split('T')[0];
        const logs = data.get('daily_logs') || {};
        logs[today] = {
            notes,
            completedTasks: completedTaskIds,
            timestamp: new Date().toISOString()
        };
        data.set('daily_logs', logs);
        window.app.emit('notify', { message: 'Daily log saved', type: 'success' });
    }
}

const planningController = new PlanningController();
export default planningController;
