/**
 * sw.js - FocusFlow Service Worker
 * Handles offline caching with path-agnostic logic for subdirectories.
 */

const CACHE_NAME = 'focusflow-v1';
const ASSETS = [
    './',
    './index.html',
    './404.html',
    './manifest.json',
    './styles/base.css',
    './styles/layout.css',
    './styles/components.css',
    './styles/focus.css',
    './styles/print.css',
    './js/app.js',
    './js/data.js',
    './js/tasks-ui.js',
    './js/tasks-form.js',
    './js/focus.js',
    './js/shortcuts.js',
    './js/planning.js',
    './js/notifications.js',
    './js/users.js',
    './js/sharing.js',
    './js/views/dashboard.js',
    './js/views/list.js',
    './js/views/kanban.js',
    './js/views/eisenhower.js',
    './js/views/calendar.js',
    './js/views/reports.js',
    './js/views/settings.js',
    './js/integrations/google-auth.js',
    './js/integrations/google-drive.js',
    './js/integrations/google-calendar.js',
    './js/integrations/gemini.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Only handle same-origin requests
    if (new URL(event.request.url).origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached asset or fetch from network
            return response || fetch(event.request).then((fetchResponse) => {
                // Optionally cache new successful same-origin requests
                if (fetchResponse.ok) {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                }
                return fetchResponse;
            });
        }).catch(() => {
            // Fallback for offline mode: return index.html for navigation requests
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});
