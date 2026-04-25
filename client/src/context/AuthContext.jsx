import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API = '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('eads_token');

  const fetchWithAuth = async (url, options = {}) => {
    const token = getToken();
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    if (res.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }
    return res;
  };

  const loadUser = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(API + '/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
      } else {
        localStorage.removeItem('eads_token');
      }
    } catch {
      localStorage.removeItem('eads_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('eads_token', data.token);
    setUser(data.user);
    await loadUser();
    return data;
  };

  const registerStudent = async (body) => {
    const res = await fetch(API + '/auth/register/student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.errors?.[0]?.msg || 'Registration failed');
    if (data.token) {
      localStorage.setItem('eads_token', data.token);
      setUser(data.user);
      await loadUser();
    }
    return data;
  };

  const registerProvider = async (body) => {
    const res = await fetch(API + '/auth/register/provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.errors?.[0]?.msg || 'Registration failed');
    if (data.token) {
      localStorage.setItem('eads_token', data.token);
      setUser(data.user);
      await loadUser();
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('eads_token');
    setUser(null);
    setProfile(null);
  };

  /** Re-fetch /auth/me and update the in-memory user + profile everywhere. */
  const refreshProfile = () => loadUser();

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, registerStudent, registerProvider, logout, fetchWithAuth, loadUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
