/**
 * js/views/calendar.js - Calendar View
 * Month/Week/Day view with FullCalendar v5 integration.
 */

import data from '../data.js';

export default class CalendarView {
    constructor() {
        this.calendar = null;
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'view-calendar';
        
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h1>Calendar</h1>
                <div id="calendar-actions" style="display: flex; gap: 12px;">
                    <!-- Placeholder for GCal toggle -->
                </div>
            </div>
            <div id="calendar-el" style="background: var(--bg-surface); padding: 20px; border-radius: var(--border-radius); border: 1px solid var(--bg-panel);"></div>
        `;

        // FullCalendar initialization must happen after the element is in the DOM
        // We'll use a small timeout or wait for the next frame
        setTimeout(() => this.initCalendar(container), 0);
        
        return container;
    }

    initCalendar(container) {
        const calendarEl = container.querySelector('#calendar-el');
        if (!window.FullCalendar) {
            calendarEl.innerHTML = '<p class="text-danger">FullCalendar library failed to load.</p>';
            return;
        }

        const { personal, shared } = data.getAllTasks();
        const allTasks = [...Object.values(personal), ...Object.values(shared)];
        
        const events = allTasks
            .filter(t => t.dueDate || t.timeBox)
            .map(t => ({
                id: t.id,
                title: t.text,
                start: t.timeBox?.start || t.dueDate,
                end: t.timeBox?.end || t.dueDate,
                allDay: !t.timeBox,
                backgroundColor: this.getQuadrantColor(t.quadrant),
                borderColor: 'transparent',
                extendedProps: { task: t }
            }));

        this.calendar = new window.FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            themeSystem: 'standard',
            height: 'auto',
            events: events,
            eventClick: (info) => {
                const taskId = info.event.id;
                // Emit event to open task edit form
                import('../tasks-form.js').then(m => m.default.open(info.event.extendedProps.task));
            },
            // FullCalendar CSS overrides for dark theme
            eventTextColor: '#fff',
        });

        this.calendar.render();
    }

    getQuadrantColor(quadrant) {
        const colors = {
            1: '#ff6b6b', // q1
            2: '#4ecdc4', // q2
            3: '#ffe66d', // q3
            4: '#a0a0b0'  // q4
        };
        return colors[quadrant] || '#6c63ff';
    }

    destroy() {
        if (this.calendar) {
            this.calendar.destroy();
        }
    }
}
