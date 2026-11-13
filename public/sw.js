// CAFFT service worker: it makes the app installable and shows the reminders
// the server pushes (server/src/reminders.ts). It caches nothing: the app
// always loads from the server, so a deploy is never hidden behind a cache.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let message = { title: 'CAFFT', body: '', url: self.registration.scope };
  try {
    message = { ...message, ...event.data.json() };
  } catch {
    // An empty or malformed push still shows the app's name.
  }
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      icon: `${self.registration.scope}icon-192.png`,
      badge: `${self.registration.scope}icon-192.png`,
      data: { url: message.url },
    }),
  );
});

// Tapping the notification brings the app to the front, or opens it.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.registration.scope));
      return open ? open.focus() : self.clients.openWindow(url);
    }),
  );
});
