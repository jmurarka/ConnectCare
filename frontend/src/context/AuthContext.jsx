import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('trainee');
  const [token, setToken] = useState(localStorage.getItem('cc_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    setLoading(true);
    const storedToken = localStorage.getItem('cc_token');
    if (storedToken) {
      try {
        const data = await apiClient.get('/api/auth/me');
        setUser(data);
        setRole(data.role);
        setToken(data.access_token);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('cc_token');
      }
    }

    // Unauthenticated state - requires role selection & login
    setUser(null);
    setToken(null);
    setRole('trainee');
    setLoading(false);
  };

  const login = async (email, password) => {
    const data = await apiClient.post('/api/auth/login', { email, password });
    localStorage.setItem('cc_token', data.access_token);
    setToken(data.access_token);
    setUser(data);
    setRole(data.role);
    return data;
  };

  const register = async (fullName, email, password, role = 'trainee', education = 'B.Tech CS', currentRole = 'Learner') => {
    const data = await apiClient.post('/api/auth/register', {
      full_name: fullName,
      email,
      password,
      role,
      education,
      current_role: currentRole
    });
    localStorage.setItem('cc_token', data.access_token);
    setToken(data.access_token);
    setUser(data);
    setRole(data.role);
    return data;
  };

  const switchRole = async (newRole) => {
    const data = await apiClient.post(`/api/auth/switch-role?role=${newRole}`);
    localStorage.setItem('cc_token', data.access_token);
    setToken(data.access_token);
    setUser(data);
    setRole(data.role);
    return data;
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('cc_token');
    setToken(null);
    setUser(null);
    setRole('trainee');
  };

  return (
    <AuthContext.Provider value={{ user, role, token, loading, login, register, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
