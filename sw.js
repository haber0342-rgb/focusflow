/**
 * sw.js - Simplified Fetch for Debugging
 */

const CACHE_NAME = 'focusflow-v2';

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
    // Network-first for everything to avoid stale module issues during deployment
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
