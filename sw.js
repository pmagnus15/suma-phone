// Suma phone app: opens instantly (the app is kept on the phone), and shows a notification when
// a teammate calls. The push itself is empty; the app reads the newest calls from the relay and
// unlocks them with the key saved on this phone.
const SHELL = 'suma-shell-v8';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png', 'js/sprites.js', 'js/world.js', 'js/looks.js', 'js/voice.js', 'js/call.js'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
// The app's own files: newest from the network when there is one, the saved copy otherwise.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  // (An error page counts as "no network": the office's address may be gone while the computer is off.)
  const saved = () => caches.match(e.request, { ignoreSearch: true });
  e.respondWith(fetch(e.request).then(async (r) => {
    if (!r.ok) return (await saved()) || r;
    const copy = r.clone(); caches.open(SHELL).then((c) => c.put(e.request, copy));
    return r;
  }).catch(async () => (await saved()) || Response.error()));
});

async function config() {
  const r = await caches.match('/__suma_config');
  return r ? r.json() : null;
}
async function unseal(keyB64, text) {
  const raw = Uint8Array.from(atob(keyB64.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  const buf = Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(0, 12) }, key, buf.slice(12));
  return JSON.parse(new TextDecoder().decode(plain));
}
self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    let title = '📞 Your team has a question', body = 'Tap to answer.', tag = 'suma-call';
    try {
      const c = await config();
      if (c) {
        const lines = (await (await fetch('https://ntfy.sh/' + c.t + '-s/json?poll=1&since=12h')).text()).trim().split('\n');
        let calls = null;
        for (const l of lines) { try { const m = JSON.parse(l); if (m.event !== 'message') continue; const s = await unseal(c.k, m.message); if (s.kind === 'calls') calls = s; } catch {} }
        const newest = calls && calls.calls && calls.calls.slice().sort((a, b) => b.at - a.at)[0];
        if (newest) { title = '📞 ' + (newest.name || 'A teammate') + ' has a question'; body = newest.question; tag = 'suma-call-' + newest.id; }
      }
    } catch {}
    await self.registration.showNotification(title, { body, tag, icon: 'icon-192.png', badge: 'icon-192.png', renotify: true });
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((ws) => (ws.length ? ws[0].focus() : self.clients.openWindow('./'))));
});
