// ============================================================================
// JADWALPRO SERVICE WORKER (Background Notification & PWA Support)
// ============================================================================

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Event klik notifikasi: Buka / Fokus kembali ke jendela aplikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Event Web Push: Tampilkan notifikasi pop-up bahkan saat tab ditutup
self.addEventListener('push', (event) => {
  let data = {
    title: '⏰ Pengingat JadwalPro',
    body: 'Ada jadwal kegiatan yang perlu Anda perhatikan sekarang.',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200, 100, 400],
      tag: 'jadwalpro-reminder',
      renotify: true,
    })
  );
});
