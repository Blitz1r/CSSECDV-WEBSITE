import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import config from '../config';

// Log frontend access denial to backend
const logAccessDenied = async (userRole, path, requiredRoles) => {
  try {
    await fetch(`${config.API_URL}/api/logs/access-denied`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userRole, path, requiredRoles })
    });
  } catch (e) {
    // Silent fail - logging should not break the app
    console.error('Failed to log access denial:', e);
  }
};

// Optional role requirement: <ProtectedRoute roles={['Administrator']}>...</ProtectedRoute>
export const ProtectedRoute = ({ children, roles }) => {
  const { loading, authenticated, role } = useAuth();
  const isDenied = roles && roles.length && !roles.includes(role);

  useEffect(() => {
    if (!loading && authenticated && isDenied) {
      logAccessDenied(role, window.location.pathname, roles);
    }
  }, [loading, authenticated, isDenied, role, roles]);

  if (loading) return <div>Loading...</div>;
  if (!authenticated) return <Navigate to="/" replace />;
  if (isDenied) {
    return <div>403 Forbidden</div>; // Fails securely with message
  }
  return children;
};

export default ProtectedRoute;
