import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Se o usuário ESTIVER logado, redirecione para a Home
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  // Se não estiver logado, mostre a página (Login ou Register)
  return <>{children}</>;
};