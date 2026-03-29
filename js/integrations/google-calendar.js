/**
 * js/integrations/google-calendar.js - Calendar Sync
 * Pushes tasks as events and fetches overlays.
 */

import googleAuth from './google-auth.js';

class GoogleCalendar {
    async pushTask(task) {
        if (!window.googleConnected) return;

        try {
            const token = await googleAuth.getValidToken();
            const event = {
                summary: task.text,
                description: task.notes || '',
                start: { dateTime: task.timeBox?.start || `${task.dueDate}T09:00:00Z` },
                end: { dateTime: task.timeBox?.end || `${task.dueDate}T10:00:00Z` },
                reminders: { useDefault: true }
            };

            const url = task.gcalEventId 
                ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.gcalEventId}`
                : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

            const resp = await fetch(url, {
                method: task.gcalEventId ? 'PUT' : 'POST',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            const result = await resp.json();
            if (result.id) {
                task.gcalEventId = result.id;
                // data.saveTask(task); - Loop prevention needed
            }
            window.app.emit('notify', { message: 'Synced to Google Calendar!', type: 'success' });
        } catch (err) {
            console.error('GoogleCalendar: Push failed', err);
        }
    }

    async fetchEvents(start, end) {
        if (!window.googleConnected) return [];

        try {
            const token = await googleAuth.getValidToken();
            const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start}&timeMax=${end}&singleEvents=true`;
            
            const resp = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await resp.json();
            return data.items || [];
        } catch (err) {
            console.error('GoogleCalendar: Fetch failed', err);
            return [];
        }
    }
}

const googleCalendar = new GoogleCalendar();
export default googleCalendar;
