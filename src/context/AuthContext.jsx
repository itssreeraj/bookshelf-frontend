import { createContext, useContext, useState } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('library_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('library_user');
    return raw ? JSON.parse(raw) : null;
  });

  function persist(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('library_token', newToken);
    localStorage.setItem('library_user', JSON.stringify(newUser));
  }

  async function login(email, password) {
    const res = await api.login(email, password);
    persist(res.token, { id: res.userId, email: res.email });
  }

  async function register(email, password, displayName) {
    const res = await api.register(email, password, displayName);
    persist(res.token, { id: res.userId, email: res.email });
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('library_token');
    localStorage.removeItem('library_user');
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
