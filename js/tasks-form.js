/**
 * js/tasks-form.js - Task Add/Edit Form Logic
 * Manages the 13-field task form and its validation/submission.
 */

import data from './data.js';

class TaskForm {
    constructor() {
        this.modal = null;
    }

    /**
     * Opens the task form modal for either a new task or an existing one.
     * @param {Object|null} taskToEdit - Existing task object or null for new task.
     */
    open(taskToEdit = null) {
        const isEdit = !!taskToEdit;
        const modalRoot = document.getElementById('modal-root');
        
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <h2>${isEdit ? 'Edit Task' : 'New Task'}</h2>
                <form id="task-form">
                    <div class="form-group">
                        <label class="form-label">Task Description *</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" id="task-text" class="form-control" placeholder="What needs to be done?" required value="${taskToEdit?.text || ''}">
                            <button type="button" class="btn btn-secondary" id="ai-suggest-btn" title="Get AI Suggestions">
                                <i data-lucide="sparkles"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label class="form-label">Duration (mins)</label>
                            <input type="number" id="task-duration" class="form-control" placeholder="30" value="${taskToEdit?.duration || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Priority</label>
                            <select id="task-priority" class="form-control">
                                <option value="Low" ${taskToEdit?.priority === 'Low' ? 'selected' : ''}>Low</option>
                                <option value="Medium" ${taskToEdit?.priority === 'Medium' || !isEdit ? 'selected' : ''}>Medium</option>
                                <option value="High" ${taskToEdit?.priority === 'High' ? 'selected' : ''}>High</option>
                                <option value="Critical" ${taskToEdit?.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label class="form-label">Eisenhower Quadrant</label>
                            <select id="task-quadrant" class="form-control">
                                <option value="1" ${taskToEdit?.quadrant == 1 ? 'selected' : ''}>Q1: Urgent + Important</option>
                                <option value="2" ${taskToEdit?.quadrant == 2 ? 'selected' : ''}>Q2: Not Urgent + Important</option>
                                <option value="3" ${taskToEdit?.quadrant == 3 ? 'selected' : ''}>Q3: Urgent + Not Important</option>
                                <option value="4" ${taskToEdit?.quadrant == 4 || !isEdit ? 'selected' : ''}>Q4: Not Urgent + Not Important</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Category / Tag</label>
                            <input type="text" id="task-category" class="form-control" placeholder="Work, Home..." value="${taskToEdit?.category || ''}">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label class="form-label">Due Date</label>
                            <input type="date" id="task-duedate" class="form-control" value="${taskToEdit?.dueDate || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Activity Type</label>
                            <select id="task-activity" class="form-control">
                                <option value="sedentary" ${taskToEdit?.activityType === 'sedentary' || !isEdit ? 'selected' : ''}>Sedentary</option>
                                <option value="physical" ${taskToEdit?.activityType === 'physical' ? 'selected' : ''}>Physical</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label class="form-label">Recurring</label>
                            <select id="task-recurring" class="form-control">
                                <option value="none" ${taskToEdit?.recurring === 'none' || !isEdit ? 'selected' : ''}>None</option>
                                <option value="daily" ${taskToEdit?.recurring === 'daily' ? 'selected' : ''}>Daily</option>
                                <option value="weekly" ${taskToEdit?.recurring === 'weekly' ? 'selected' : ''}>Weekly</option>
                                <option value="monthly" ${taskToEdit?.recurring === 'monthly' ? 'selected' : ''}>Monthly</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Rollover Behaviour</label>
                            <select id="task-rollover" class="form-control">
                                <option value="indefinite" ${taskToEdit?.rollover === 'indefinite' || !isEdit ? 'selected' : ''}>Indefinite</option>
                                <option value="stop_n" ${taskToEdit?.rollover === 'stop_n' ? 'selected' : ''}>Stop after N days</option>
                                <option value="archive_n" ${taskToEdit?.rollover === 'archive_n' ? 'selected' : ''}>Archive if not started</option>
                            </select>
                            <input type="number" id="task-rollover-limit" class="form-control ${taskToEdit?.rollover && taskToEdit.rollover !== 'indefinite' ? '' : 'hidden'}" 
                                   style="margin-top: 8px;" placeholder="Days (N)" value="${taskToEdit?.rolloverLimit || 3}">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label class="form-label">Time-box Start</label>
                            <input type="datetime-local" id="task-timebox-start" class="form-control" value="${taskToEdit?.timeBox?.start || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Time-box End</label>
                            <input type="datetime-local" id="task-timebox-end" class="form-control" value="${taskToEdit?.timeBox?.end || ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Subtasks (one per line)</label>
                        <textarea id="task-subtasks" class="form-control" rows="2" placeholder="Step 1&#10;Step 2">${taskToEdit?.subtasks?.map(s => s.text).join('\n') || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes (Markdown support)</label>
                        <textarea id="task-notes" class="form-control" rows="3" placeholder="Additional details...">${taskToEdit?.notes || ''}</textarea>
                    </div>

                    <div class="form-group" id="gcal-sync-group">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="task-gcal" ${taskToEdit?.gcalEventId ? 'checked' : ''}> 
                            Schedule to Google Calendar?
                        </label>
                    </div>

                    <div class="form-group" style="display: flex; align-items: center; gap: 12px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="task-shared" ${taskToEdit?.shared ? 'checked' : ''}> 
                            Mark as shared?
                        </label>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                        <button type="button" class="btn btn-secondary" id="form-cancel">Cancel</button>
                        <button type="submit" class="btn btn-primary">${isEdit ? 'Update Task' : 'Create Task'}</button>
                    </div>
                </form>
            </div>
        `;
        
        modalRoot.appendChild(this.modal);
        this.bindEvents(taskToEdit);
    }

    bindEvents(taskToEdit) {
        const form = this.modal.querySelector('#task-form');
        const cancelBtn = this.modal.querySelector('#form-cancel');
        const rolloverSelect = this.modal.querySelector('#task-rollover');
        const rolloverLimit = this.modal.querySelector('#task-rollover-limit');
        const gcalGroup = this.modal.querySelector('#gcal-sync-group');
        
        // Conditional GCal visibility
        // (In Phase K, we'll check google-auth state)
        if (!window.googleConnected) {
            gcalGroup.classList.add('hidden');
        }

        rolloverSelect.addEventListener('change', () => {
            rolloverLimit.classList.toggle('hidden', rolloverSelect.value === 'indefinite');
        });

        cancelBtn.addEventListener('click', () => this.close());
        
        const aiBtn = this.modal.querySelector('#ai-suggest-btn');
        aiBtn.onclick = async () => {
            const text = document.getElementById('task-text').value;
            if (!text) {
                window.app.emit('notify', { message: 'Enter a task description first', type: 'info' });
                return;
            }

            aiBtn.disabled = true;
            const originalHtml = aiBtn.innerHTML;
            aiBtn.innerHTML = '<i data-lucide="loader"></i>';
            if (window.lucide) window.lucide.createIcons();

            try {
                const { default: gemini } = await import('./integrations/gemini.js');
                const meta = await gemini.suggestTaskMeta(text);
                
                if (meta.duration) document.getElementById('task-duration').value = meta.duration;
                if (meta.priority) document.getElementById('task-priority').value = meta.priority;
                if (meta.quadrant) document.getElementById('task-quadrant').value = meta.quadrant;
                if (meta.category) document.getElementById('task-category').value = meta.category;
                
                window.app.emit('notify', { message: 'AI suggestions applied!', type: 'success' });
            } catch (err) {
                window.app.emit('notify', { message: 'AI suggestions failed', type: 'error' });
            } finally {
                aiBtn.disabled = false;
                aiBtn.innerHTML = originalHtml;
                if (window.lucide) window.lucide.createIcons();
            }
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(taskToEdit);
        });

        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    handleSubmit(taskToEdit) {
        const formData = {
            id: taskToEdit?.id || Date.now().toString(),
            text: document.getElementById('task-text').value,
            duration: parseInt(document.getElementById('task-duration').value) || null,
            priority: document.getElementById('task-priority').value,
            quadrant: parseInt(document.getElementById('task-quadrant').value),
            category: document.getElementById('task-category').value,
            dueDate: document.getElementById('task-duedate').value,
            timeBox: {
                start: document.getElementById('task-timebox-start').value,
                end: document.getElementById('task-timebox-end').value
            },
            subtasks: document.getElementById('task-subtasks').value
                .split('\n')
                .filter(s => s.trim())
                .map(s => ({ text: s.trim(), done: false })),
            activityType: document.getElementById('task-activity').value,
            recurring: document.getElementById('task-recurring').value,
            rollover: document.getElementById('task-rollover').value,
            rolloverLimit: parseInt(document.getElementById('task-rollover-limit').value) || null,
            notes: document.getElementById('task-notes').value,
            shared: document.getElementById('task-shared').checked,
            status: taskToEdit?.status || 'todo',
            created: taskToEdit?.created || new Date().toISOString()
        };

        // GCal integration (stub)
        if (document.getElementById('task-gcal').checked) {
            // In Phase K, call google-calendar.js
            formData.gcalSyncRequested = true;
        }

        data.saveTask(formData, formData.shared);
        this.close();
    }

    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}

const taskForm = new TaskForm();
export default taskForm;
