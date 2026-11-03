// Background Firebase Cloud Messaging Service Worker
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

/* eslint-disable no-undef */
const firebaseConfig = {
  apiKey: "placeholder",
  projectId: "aits-bus",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:mock",
};

if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.info("[firebase-messaging-sw.js] Received background push message:", payload);

  const notificationTitle = payload.notification?.title || "AITS Bus Tracker";
  const notificationOptions = {
    body: payload.notification?.body || "Live transit update received.",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    data: {
      url: payload.data?.url || "/dashboard",
      tripId: payload.data?.tripId,
      busId: payload.data?.busId,
    },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

