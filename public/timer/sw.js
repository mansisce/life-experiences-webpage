const CACHE = 'pomodoro-v2';
const ASSETS = ['/timer/', '/timer/index.html', '/timer/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  );
});

// ── Background alarm scheduling ───────────────────────────────────────────
let alarmTimer = null;

self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_ALARM') {
    clearTimeout(alarmTimer);
    const delay = Math.max(0, e.data.fireAt - Date.now());
    alarmTimer = setTimeout(() => {
      self.registration.showNotification(e.data.title, {
        body: e.data.body,
        icon: '/timer/icon-192.png',
        tag: 'pomodoro-alarm',
        renotify: true,
        requireInteraction: false,
      });
    }, delay);
  }

  if (e.data?.type === 'CANCEL_ALARM') {
    clearTimeout(alarmTimer);
  }
});
