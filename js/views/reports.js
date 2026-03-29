/**
 * js/views/reports.js - Reports and Analytics View
 * Displays productivity charts and handles one-click PDF export.
 */

import data from '../data.js';

export default class ReportsView {
    constructor() {
        this.charts = [];
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'view-reports';
        
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                <h1>Productivity Report</h1>
                <button class="btn btn-primary" id="export-pdf-btn">
                    <i data-lucide="download"></i> Export PDF
                </button>
            </div>

            <div class="reports-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
                <div class="card chart-container">
                    <h3>Physical vs. Sedentary</h3>
                    <canvas id="activity-chart" style="max-height: 300px;"></canvas>
                </div>
                <div class="card chart-container">
                    <h3>Eisenhower Distribution</h3>
                    <canvas id="quadrant-chart" style="max-height: 300px;"></canvas>
                </div>
            </div>

            <div class="card">
                <h3>Daily Logs</h3>
                <div id="logs-container" style="margin-top: 16px;">
                    <!-- Logs populated below -->
                </div>
            </div>
        `;

        this.initCharts(container);
        this.populateLogs(container);
        this.bindEvents(container);
        
        return container;
    }

    async initCharts(container) {
        if (!window.Chart) return;

        const { personal, shared } = data.getAllTasks();
        const allTasks = [...Object.values(personal), ...Object.values(shared)];

        // Activity Chart (Pie)
        const physical = allTasks.filter(t => t.activityType === 'physical').length;
        const sedentary = allTasks.filter(t => t.activityType === 'sedentary').length;
        
        const activityCtx = container.querySelector('#activity-chart');
        this.charts.push(new window.Chart(activityCtx, {
            type: 'pie',
            data: {
                labels: ['Physical', 'Sedentary'],
                datasets: [{
                    data: [physical, sedentary],
                    backgroundColor: ['#4ecdc4', '#ff6b6b']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        }));

        // Eisenhower Distribution (Bar)
        const counts = [1, 2, 3, 4].map(q => allTasks.filter(t => t.quadrant === q).length);
        const quadrantCtx = container.querySelector('#quadrant-chart');
        this.charts.push(new window.Chart(quadrantCtx, {
            type: 'bar',
            data: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                datasets: [{
                    label: 'Task Count',
                    data: counts,
                    backgroundColor: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a0a0b0']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        }));
    }

    populateLogs(container) {
        const logs = data.get('daily_logs') || {};
        const logsEl = container.querySelector('#logs-container');
        
        const sortedDates = Object.keys(logs).sort((a, b) => new Date(b) - new Date(a));
        
        if (sortedDates.length === 0) {
            logsEl.innerHTML = '<p class="text-dim">No daily logs found.</p>';
            return;
        }

        sortedDates.forEach(date => {
            const log = logs[date];
            const div = document.createElement('div');
            div.style.marginBottom = '20px';
            div.style.padding = '12px';
            div.style.borderLeft = '4px solid var(--accent-primary)';
            div.style.background = 'var(--bg-panel)';
            div.style.borderRadius = '0 8px 8px 0';
            div.innerHTML = `
                <div style="font-weight: 600;">${date}</div>
                <div class="text-muted" style="margin-top: 4px;">${log.notes || 'No notes for this day.'}</div>
                <div class="text-dim" style="font-size: 11px; margin-top: 4px;">Completed ${log.completedTasks.length} tasks</div>
            `;
            logsEl.appendChild(div);
        });
    }

    bindEvents(container) {
        container.querySelector('#export-pdf-btn').addEventListener('click', () => this.exportPDF());
    }

    async exportPDF() {
        if (!window.jspdf || !window.html2canvas) {
            window.app.emit('notify', { message: 'PDF Export libraries not loaded.', type: 'error' });
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const container = document.querySelector('.view-reports');

        // 1. Capture Header
        const header = container.querySelector('h1');
        const headerCanvas = await window.html2canvas(header, { backgroundColor: '#ffffff' });
        doc.addImage(headerCanvas.toDataURL('image/png'), 'PNG', 10, 10, 50, 10);

        // 2. Capture Charts (Chart.js provides toBase64Image natively)
        let yPos = 30;
        this.charts.forEach((chart, index) => {
            const chartImg = chart.toBase64Image();
            doc.addImage(chartImg, 'PNG', 10, yPos, 90, 60);
            if (index % 2 === 1) yPos += 70; // New row
        });

        // 3. Save
        doc.save(`FocusFlow_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        window.app.emit('notify', { message: 'PDF Report exported!', type: 'success' });
    }

    destroy() {
        this.charts.forEach(c => c.destroy());
    }
}
