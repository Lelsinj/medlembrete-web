// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // NOVO: getDoc para buscar perfil
import type { User } from 'firebase/auth';
import { auth, db } from '../firebase-config';

// NOVO: Interface para o perfil do Firestore
interface UserProfile {
  name: string;
  email: string;
  birthDate?: Date; // Opcional, depende do que foi salvo
}

// NOVO: Interface de retorno para o Hook
interface AuthState {
  currentUser: User | null;
  userProfile: UserProfile | null; // Dados do Firestore
  loading: boolean;
}

export const useAuth = (): AuthState => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Se o usuário está logado, busca o perfil no Firestore
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Extrai o nome e outros dados e salva no estado
          const profileData = docSnap.data();
          setUserProfile({
            name: profileData.name,
            email: profileData.email,
            birthDate: profileData.birthDate?.toDate() // Converte Timestamp para Date
          });
        }
      } else {
        // Se deslogado, limpa o perfil
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { currentUser, userProfile, loading };
};