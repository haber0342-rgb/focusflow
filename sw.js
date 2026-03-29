/**
 * sw.js - FocusFlow Service Worker
 * Handles offline caching for same-origin static assets.
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

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Cache-first for same-origin static assets
    if (ASSETS.includes(url.pathname.replace(/^\/focusflow/, '.'))) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    } else {
        // Network-first for everything else (CDNs, Google APIs, Gemini)
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
    }
});
