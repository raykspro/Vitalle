import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

const AuthGuard = ({ children }) => {
  const { isSignedIn } = useUser();

  return isSignedIn ? children : <Navigate to="/login" replace />;
};

export default AuthGuard;