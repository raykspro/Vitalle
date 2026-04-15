import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

const AuthGuard = () => {
  const { isLoaded, isSignedIn } = useAuth();

  // Se o Clerk ainda está carregando o estado, ficamos em branco (ou um loading) 
  // para evitar loops de redirecionamento.
  if (!isLoaded) return null;

  // Se estiver logado, renderiza as rotas filhas (Outlet). 
  // Se não, manda para o login.
  return isSignedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

export default AuthGuard;