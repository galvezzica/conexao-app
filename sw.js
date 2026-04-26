const CACHE = 'conexao-v2';
const ASSETS = ['/', '/manifest.json', '/icon-192.svg', '/icon-512.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put('/', copy));
        return r;
      }).catch(() => caches.match('/'))
    );
  }
});

// Suporte a push notifications (quando integrar servidor de push depois)
self.addEventListener('push', (e) => {
  let data = { title: 'Conexão', body: 'Você tem uma nova notificação' };
  try { if (e.data) data = e.data.json(); } catch {}
  e.waitUntil(self.registration.showNotification(data.title || 'Conexão', {
    body: data.body || '',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: data.tag || 'default',
    data: data.url || '/',
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(clients => {
    for (const c of clients) { if (c.url.includes(self.location.origin)) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
