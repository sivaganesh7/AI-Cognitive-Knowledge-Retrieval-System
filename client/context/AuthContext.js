'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, onAuthStateChanged } from '@/lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshToken = useCallback(async (firebaseUser) => {
    if (firebaseUser) {
      const idToken = await firebaseUser.getIdToken(true);
      setToken(idToken);
      return idToken;
    }
    return null;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setUser(firebaseUser);
        setToken(idToken);

        // Auto-refresh token every 55 minutes
        const interval = setInterval(async () => {
          await refreshToken(firebaseUser);
        }, 55 * 60 * 1000);

        setLoading(false);
        return () => clearInterval(interval);
      } else {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [refreshToken]);

  return (
    <AuthContext.Provider value={{ user, token, loading, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
