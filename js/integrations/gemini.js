/**
 * js/integrations/gemini.js - Gemini AI Features
 * Powers smart intake, prioritisation, refocus, and reflections.
 */

class GeminiAI {
    constructor() {
        this.model = 'gemini-2.0-flash';
        this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    }

    getApiKey() {
        return localStorage.getItem('ff_settings_gemini_api_key');
    }

    async call(prompt, fallback) {
        const apiKey = this.getApiKey();
        if (!apiKey) return fallback;

        try {
            const resp = await fetch(`${this.endpoint}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (resp.status === 429) {
                window.app.emit('notify', { message: 'AI quota reached. Using fallback.', type: 'warning' });
                return fallback;
            }

            const data = await resp.json();
            return data.candidates[0].content.parts[0].text.trim() || fallback;
        } catch (err) {
            console.error('Gemini: Call failed', err);
            return fallback;
        }
    }

    // --- AI Features (1-7) ---

    async suggestTaskMeta(description) {
        const prompt = `Suggest duration (mins), priority (Critical/High/Medium/Low), Eisenhower quadrant (1-4), and category for this task: "${description}". Format as JSON: {duration, priority, quadrant, category}`;
        const fallback = '{"duration": 30, "priority": "Medium", "quadrant": 4, "category": "General"}';
        const result = await this.call(prompt, fallback);
        try { return JSON.parse(result); } catch (e) { return JSON.parse(fallback); }
    }

    async suggestTop3(tasksJson) {
        const prompt = `Analyze these tasks and suggest the top 3 for today: ${tasksJson}`;
        const fallback = 'Focus on your highest priority and earliest due date tasks.';
        return await this.call(prompt, fallback);
    }

    async getProcrastinationPrompt(taskName, taskDesc) {
        const prompt = `The user is stuck on "${taskName}". Description: "${taskDesc}". Give a one-sentence CBT-style prompt for the smallest first step.`;
        const fallback = 'What\'s the smallest possible first step for this task?';
        return await this.call(prompt, fallback);
    }

    async getRefocusNudge(taskName) {
        const prompt = `The user is drifting from "${taskName}". Give a short, encouraging refocus nudge.`;
        const fallback = 'Stay focused! You can do this.';
        return await this.call(prompt, fallback);
    }

    async getSessionReflection(taskName, logJson) {
        const prompt = `The focus session for "${taskName}" just ended. Give one constructive or encouraging sentence based on this log: ${logJson}`;
        const fallback = 'Great job finishing your session!';
        return await this.call(prompt, fallback);
    }

    async getWeeklyInsight(statsJson) {
        const prompt = `Summarize this week's productivity in plain English: ${statsJson}`;
        const fallback = 'You had a productive week with consistent focus.';
        return await this.call(prompt, fallback);
    }

    async getDailyObservation(statsJson) {
        const prompt = `Give a brief observation on today's progress: ${statsJson}`;
        const fallback = 'Another day of steady progress. Well done.';
        return await this.call(prompt, fallback);
    }
}

const geminiAI = new GeminiAI();
export default geminiAI;
