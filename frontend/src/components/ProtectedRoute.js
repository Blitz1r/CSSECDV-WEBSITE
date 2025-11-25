import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

// Optional role requirement: <ProtectedRoute roles={['Administrator']}>...</ProtectedRoute>
export const ProtectedRoute = ({ children, roles }) => {
  const { loading, authenticated, role } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!authenticated) return <Navigate to="/" replace />;
  if (roles && roles.length && !roles.includes(role)) {
    return <div>403 Forbidden</div>; // Fails securely with message
  }
  return children;
};

export default ProtectedRoute;
