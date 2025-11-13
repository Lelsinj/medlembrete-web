import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Este componente recebe "children", que é a página que queremos proteger
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  // 1. Se estiver carregando, mostre uma mensagem
  if (loading) {
    return <div>Carregando...</div>;
    // Em breve, podemos trocar isso por um "Loading Spinner" bonito
  }

  // 2. Se não estiver carregando E não tiver usuário, redirecione para o login
  if (!currentUser) {
    return <Navigate to="/login" replace />; 
    // 'replace' impede o usuário de voltar para a página anterior
  }

  // 3. Se tudo estiver ok, mostre a página (children)
  return <>{children}</>;
};