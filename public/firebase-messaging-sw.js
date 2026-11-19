importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js');
importScripts('/firebase-messaging-config.js');

firebase.initializeApp(self.__FIREBASE_CONFIG__);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {};
    const data = payload.data || {};

    const title = notification.title || data.title || 'Notification';
    const options = {
        body: notification.body || data.body || '',
        icon:
            notification.icon ||
            data.icon ||
            '/images/push/icon.png',
        badge: data.badge || '/images/push/badge.png',
        image: notification.image || data.image || '/images/push/icon.png',
        data: {
            url: data.click_action || data.link || '/',
        },
        vibrate: [120, 60, 120],
    };

    return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification?.data?.url || '/';

    event.waitUntil(
        clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                for (const client of windowClients) {
                    if ('focus' in client) {
                        client.navigate(targetUrl);
                        return client.focus();
                    }
                }

                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            }),
    );
});
