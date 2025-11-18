import { useEffect } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase-config';
import { useAuth } from '../hooks/useAuth';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const NotificationHandler = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Permissão de notificação concedida.');
          
          // Vamos buscar a instância de messaging aqui
          const messaging = getMessaging();

          // 1. Esperar o Service Worker estar pronto
          const swRegistration = await navigator.serviceWorker.ready;

          // 2. Chamar o getToken com a referência explícita ao SW
          const currentToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swRegistration, // <-- A MUDANÇA IMPORTANTE
          });

          if (currentToken) {
            console.log('Token FCM obtido:', currentToken);
            try {
              // 3. Guardar o Token no Firestore
              const userDocRef = doc(db, 'users', currentUser.uid);
              
              await setDoc(userDocRef, {
                fcmTokens: arrayUnion(currentToken), 
                email: currentUser.email
              }, { merge: true });

              console.log("Token adicionado à lista no Firestore!");

            } catch (error) {
              console.error("Erro ao salvar o token no Firestore:", error);
            }
          } else {
            console.log('Não foi possível obter o token.');
          }
        } else {
          console.log('Permissão de notificação negada.');
        }
      } catch (error) {
        console.error('Ocorreu um erro ao obter o token:', error);
      }
    };

    requestPermission();

  }, [currentUser]); // Rode este efeito sempre que o currentUser mudar

  // Este componente não renderiza nada na tela
  return null;
};