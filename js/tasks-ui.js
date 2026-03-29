/**
 * js/tasks-ui.js - Task UI Components
 * Handles rendering of task cards, status toggles, and Markdown notes.
 */

import data from './data.js';
import taskForm from './tasks-form.js';

class TaskUI {
    /**
     * Renders a task card element.
     * @param {Object} task - The task object.
     * @returns {HTMLElement}
     */
    renderCard(task) {
        const card = document.createElement('div');
        card.className = `card task-card status-${task.status} priority-${task.priority.toLowerCase()}`;
        card.dataset.id = task.id;
        card.dataset.shared = task.shared;

        const isDone = task.status === 'done';
        
        card.innerHTML = `
            <div class="task-card-header">
                <input type="checkbox" class="task-status-toggle" ${isDone ? 'checked' : ''}>
                <span class="task-title ${isDone ? 'done' : ''}">${task.text}</span>
                <div class="task-actions">
                    <button class="task-edit-btn" title="Edit Task"><i data-lucide="edit-2"></i></button>
                    <button class="task-focus-btn" title="Start Focus"><i data-lucide="play"></i></button>
                </div>
            </div>
            
            <div class="task-meta">
                ${task.duration ? `<span class="meta-item"><i data-lucide="clock"></i> ${task.duration}m</span>` : ''}
                ${task.priority ? `<span class="meta-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>` : ''}
                ${task.category ? `<span class="meta-item"><i data-lucide="tag"></i> ${task.category}</span>` : ''}
                ${task.dueDate ? `<span class="meta-item"><i data-lucide="calendar"></i> ${this.formatDate(task.dueDate)}</span>` : ''}
                ${task.rolloverDate ? `<span class="meta-rollover" title="Rolled over"><i data-lucide="rotate-cw"></i></span>` : ''}
            </div>

            ${task.notes ? `
                <div class="task-notes-preview markdown-content">
                    ${this.renderMarkdown(task.notes)}
                </div>
            ` : ''}

            ${task.subtasks && task.subtasks.length > 0 ? `
                <div class="task-subtasks">
                    ${task.subtasks.map(s => `
                        <div class="subtask-item">
                            <input type="checkbox" ${s.done ? 'checked' : ''} disabled>
                            <span>${s.text}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;

        this.bindCardEvents(card, task);
        return card;
    }

    bindCardEvents(card, task) {
        const toggle = card.querySelector('.task-status-toggle');
        const editBtn = card.querySelector('.task-edit-btn');
        const focusBtn = card.querySelector('.task-focus-btn');
        const notesPreview = card.querySelector('.task-notes-preview');

        toggle.addEventListener('change', () => {
            const newStatus = toggle.checked ? 'done' : 'todo';
            task.status = newStatus;
            data.saveTask(task, task.shared);
        });

        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            taskForm.open(task);
        });

        focusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.app.emit('startFocus', task);
        });

        if (notesPreview) {
            notesPreview.addEventListener('click', (e) => {
                e.stopPropagation();
                this.enterInlineNoteEdit(notesPreview, task);
            });
        }
    }

    /**
     * Handles inline editing of task notes.
     */
    enterInlineNoteEdit(container, task) {
        const textarea = document.createElement('textarea');
        textarea.className = 'form-control task-note-editor';
        textarea.value = task.notes || '';
        
        const originalContent = container.innerHTML;
        container.innerHTML = '';
        container.appendChild(textarea);
        textarea.focus();

        const save = () => {
            const newNotes = textarea.value;
            if (newNotes !== task.notes) {
                task.notes = newNotes;
                data.saveTask(task, task.shared);
            }
            container.innerHTML = this.renderMarkdown(task.notes);
        };

        textarea.addEventListener('blur', save);
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                container.innerHTML = originalContent;
            }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                save();
            }
        });
    }

    renderMarkdown(text) {
        if (!text) return '';
        const rawHtml = window.marked.parse(text);
        return window.DOMPurify.sanitize(rawHtml);
    }

    formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
}

const taskUI = new TaskUI();
export default taskUI;
