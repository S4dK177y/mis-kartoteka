import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

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
      
      if (status.encryptionInitialized && !status.isUnlocked) {
        setIsLocked(true);
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
    try {
      await api.logout();
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
    }
  };

  const setup = async (username, password) => {
    await api.setupSystem(username, password);
    setNeedsSetup(false);
    await login(username, password);
  };

  const setupEncryption = async (password) => {
    await api.setupEncryption(password);
    setIsLocked(false);
    await checkAuth();
  };

  const lock = async () => {
    try {
      await api.lockSystem();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLocked(true);
    }
  };

  const unlock = async (password) => {
    try {
      const res = await api.unlockSystem(password);
      if (res.isUnlocked) {
        setIsLocked(false);
        await checkAuth();
      }
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, needsSetup, isLocked, login, logout, setup, setupEncryption, unlock, lock }}>
      {children}
    </AuthContext.Provider>
  );
};
