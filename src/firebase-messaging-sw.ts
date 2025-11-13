import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import { precacheAndRoute } from 'workbox-precaching';

declare const self: any;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

precacheAndRoute(self.__WB_MANIFEST);

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, payload => {
  const notificationTitle = payload.notification?.title || 'Notificação';
  const notificationOptions: NotificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova mensagem.',
    icon: '/favicon.ico',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
