import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const status = await api.checkSystemStatus();
      if (status.needsSetup) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }

      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const data = await api.login(username, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const setup = async (username, password) => {
    await api.setupSystem(username, password);
    setNeedsSetup(false);
    await login(username, password);
  };

  return (
    <AuthContext.Provider value={{ user, loading, needsSetup, login, logout, setup }}>
      {children}
    </AuthContext.Provider>
  );
};
