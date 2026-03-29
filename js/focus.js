/**
 * js/focus.js - Focus Mode Controller
 * Handles full-screen focus sessions, timers, idle detection, and ambient sound.
 */

import data from './data.js';

class FocusController {
    constructor() {
        this.activeTask = null;
        this.timerInterval = null;
        this.timeLeft = 0;
        this.isPaused = false;
        this.sessionLog = { drifts: 0, breaks: 0, start: null };
        
        // Idle detection
        this.lastUserAction = Date.now();
        this.idleInterval = null;
        this.breakReminderShown = false;
        this.procrastinationShown = false;
        
        // Web Audio
        this.audioCtx = null;
        this.ambientSource = null;
        
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        window.app.on('startFocus', (e) => this.start(e.detail));
        
        // Track user activity for idle detection
        const trackActivity = () => {
            this.lastUserAction = Date.now();
            if (this.procrastinationShown) this.clearProcrastination();
        };
        window.addEventListener('mousemove', trackActivity);
        window.addEventListener('keydown', trackActivity);
        window.addEventListener('click', trackActivity);
    }

    start(task) {
        this.activeTask = task;
        this.timeLeft = (task.duration || 25) * 60;
        this.sessionLog = { drifts: 0, breaks: 0, start: new Date().toISOString() };
        
        const overlay = document.getElementById('focus-overlay');
        overlay.innerHTML = `
            <div class="focus-task-anchor">
                <div class="focus-task-title">${task.text}</div>
                <div class="focus-task-desc">${task.notes || ''}</div>
            </div>
            
            <div class="focus-timer-container">
                <div id="focus-timer-display" class="focus-timer">${this.formatTime(this.timeLeft)}</div>
                <div class="focus-controls">
                    <button class="btn btn-secondary" id="focus-pause-btn"><i data-lucide="pause"></i> Pause</button>
                    <button class="btn btn-primary" id="focus-end-btn"><i data-lucide="check"></i> Finish</button>
                </div>
                <div class="drift-btn" id="drift-btn">I'm drifting...</div>
            </div>

            <div class="focus-footer">
                <div class="ambient-controls">
                    <span class="text-dim" style="font-size: 10px; margin-right: 8px;">AMBIENT</span>
                    <button class="ambient-btn active" data-type="none">None</button>
                    <button class="ambient-btn" data-type="white">White Noise</button>
                    <button class="ambient-btn" data-type="rain">Rain</button>
                </div>
                <button class="btn btn-secondary" id="focus-exit-btn">Exit Fullscreen</button>
            </div>

            <div id="focus-prompt-root"></div>
        `;
        
        overlay.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
        
        this.startTimer();
        this.startIdleDetection();
        this.bindFocusEvents(overlay);
        
        if (overlay.requestFullscreen) overlay.requestFullscreen().catch(() => {});
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.isPaused) return;
            this.timeLeft--;
            document.getElementById('focus-timer-display').innerText = this.formatTime(this.timeLeft);
            if (this.timeLeft <= 0) this.finishSession();
        }, 1000);
    }

    startIdleDetection() {
        this.idleInterval = setInterval(() => {
            const idleTime = Date.now() - this.lastUserAction;
            
            // 1. Break Reminder (60s idle)
            if (idleTime > 60000 && !this.breakReminderShown) {
                this.showBreakReminder();
            }
            
            // 2. Procrastination Helper (3m idle)
            if (idleTime > 180000 && !this.procrastinationShown) {
                this.showProcrastination();
            }

            // 3. Productivity Monitor (30m idle)
            if (idleTime > 1800000) {
                this.showProductivityIdle();
            }
        }, 10000);
    }

    showProductivityIdle() {
        if (confirm(`Still working on "${this.activeTask.text}"?`)) {
            this.lastUserAction = Date.now();
        } else {
            this.isPaused = true;
            this.lastUserAction = Date.now();
        }
    }

    showBreakReminder() {
        this.breakReminderShown = true;
        // In-app notification or nudge
        console.log('Focus: Idle for 60s. Break reminder?');
        // Reset productivity timer (30min) in app.js if needed
        window.app.emit('idleDetected', { type: 'break', task: this.activeTask });
    }

    showProcrastination() {
        this.procrastinationShown = true;
        const root = document.getElementById('focus-prompt-root');
        root.innerHTML = `
            <div class="modal cbt-prompt">
                <div class="modal-content">
                    <h3>Focus Check</h3>
                    <p>What's the smallest possible first step for "${this.activeTask.text}"?</p>
                    <input type="text" id="procrastination-answer" class="form-control" placeholder="Type it here...">
                    <button class="btn btn-primary" style="margin-top: 16px;" id="cbt-submit">I'm back!</button>
                </div>
            </div>
        `;
        document.getElementById('cbt-submit').onclick = () => this.clearProcrastination();
    }

    clearProcrastination() {
        const root = document.getElementById('focus-prompt-root');
        if (root) root.innerHTML = '';
        this.procrastinationShown = false;
        this.lastUserAction = Date.now();
    }

    bindFocusEvents(overlay) {
        overlay.querySelector('#focus-pause-btn').onclick = () => {
            this.isPaused = !this.isPaused;
            const btn = overlay.querySelector('#focus-pause-btn');
            btn.innerHTML = this.isPaused ? '<i data-lucide="play"></i> Resume' : '<i data-lucide="pause"></i> Pause';
            if (window.lucide) window.lucide.createIcons();
        };

        overlay.querySelector('#focus-end-btn').onclick = () => this.finishSession();
        overlay.querySelector('#focus-exit-btn').onclick = () => this.exit();
        overlay.querySelector('#drift-btn').onclick = () => {
            this.sessionLog.drifts++;
            window.app.emit('driftDetected', { task: this.activeTask });
        };

        // Ambient Buttons
        overlay.querySelectorAll('.ambient-btn').forEach(btn => {
            btn.onclick = () => {
                overlay.querySelectorAll('.ambient-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.toggleAmbient(btn.dataset.type);
            };
        });
    }

    toggleAmbient(type) {
        if (this.ambientSource) {
            this.ambientSource.stop();
            this.ambientSource = null;
        }
        if (type === 'none') return;
        
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const bufferSize = 2 * this.audioCtx.sampleRate,
              noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate),
              output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        if (type === 'white') {
            noise.connect(this.audioCtx.destination);
        } else if (type === 'rain') {
            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;
            
            const lfo = this.audioCtx.createOscillator();
            const lfoGain = this.audioCtx.createGain();
            lfo.frequency.value = 0.5;
            lfoGain.gain.value = 0.2;
            lfo.connect(lfoGain.gain);
            
            noise.connect(filter);
            filter.connect(this.audioCtx.destination);
            lfo.start();
        }
        
        noise.start();
        this.ambientSource = noise;
    }

    finishSession() {
        const timeSpent = Math.floor(((task.duration || 25) * 60 - this.timeLeft) / 60);
        this.sessionLog.end = new Date().toISOString();
        this.sessionLog.timeSpent = timeSpent;
        
        // Log focus session
        const logs = data.get('focus_logs') || [];
        logs.push({
            taskId: this.activeTask.id,
            ...this.sessionLog
        });
        data.set('focus_logs', logs);
        
        // Prompt for status change
        this.exit();
        window.app.emit('focusEnded', { task: this.activeTask, log: this.sessionLog });
    }

    exit() {
        clearInterval(this.timerInterval);
        clearInterval(this.idleInterval);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        document.getElementById('focus-overlay').classList.add('hidden');
        if (this.ambientSource) this.ambientSource.stop();
    }
}

const focusController = new FocusController();
export default focusController;
