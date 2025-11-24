// Central site-wide authorization/session provider (Objective 2.2.1)
// Exposes: authenticated user, role, loading state, refresh and logout helpers.
// All ProtectedRoute checks reference this single source of truth.
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import config from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.API_URL}/api/login/session`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setAuthenticated(true);
          setUser(data.user);
          try {
            localStorage.setItem('email', data.user.email);
            localStorage.setItem('role', data.user.role);
          } catch {}
        } else {
          setAuthenticated(false);
          setUser(null);
        }
      } else if (res.status === 401) {
        setAuthenticated(false);
        setUser(null);
      }
    } catch (e) {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${config.API_URL}/api/login/logout`, { method: 'POST', credentials: 'include' });
    } catch {}
    setAuthenticated(false);
    setUser(null);
    try {
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      localStorage.removeItem('auth');
    } catch {}
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const handler = () => refreshSession();
    window.addEventListener('auth-changed', handler);
    return () => window.removeEventListener('auth-changed', handler);
  }, [refreshSession]);

  const value = {
    loading,
    authenticated,
    user,
    role: user?.role,
    refreshSession,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
