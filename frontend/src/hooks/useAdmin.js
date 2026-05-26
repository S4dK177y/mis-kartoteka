import { useState, useCallback } from 'react';
import { api } from '../api';

export function useAdmin() {
  // Users state
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');

  // Logs state
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState({ totalLogs: 0, exactBytes: 0 });
  const [settings, setSettings] = useState({ logRetentionDays: '30', maxLogSpaceMb: '50' });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Backups state
  const [backups, setBackups] = useState([]);
  const [backupSettings, setBackupSettings] = useState({ enabled: false, cron: '0 2 * * *', maxCount: 7 });
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupActionLoading, setBackupActionLoading] = useState(false);

  // Security state
  const [cpLoading, setCpLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // --- Users Actions ---
  const fetchUsers = useCallback(async () => {
    const data = await api.getUsers();
    setUsers(data);
  }, []);

  const createUser = async (username, password, role) => {
    setUserLoading(true);
    setUserError('');
    try {
      await api.createUser(username, password, role);
      await fetchUsers();
      return { success: true };
    } catch (err) {
      const errorMsg = err.message || 'Ошибка создания пользователя';
      setUserError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setUserLoading(false);
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      await api.updateUserRole(userId, role);
      await fetchUsers();
      return true;
    } catch {
      return false;
    }
  };

  // --- Logs & Settings Actions ---
  const fetchLogs = useCallback(async () => {
    const [logsData, statsData, settingsData] = await Promise.all([
      api.getLogs(), api.getLogStats(), api.getSettings()
    ]);
    setLogs(logsData);
    setLogStats(statsData);
    setSettings(prev => ({ 
      ...prev, 
      logRetentionDays: settingsData.logRetentionDays || prev.logRetentionDays,
      maxLogSpaceMb: settingsData.maxLogSpaceMb || prev.maxLogSpaceMb
    }));
  }, []);

  const saveSettings = async (newSettings) => {
    setSettingsLoading(true);
    try {
      await api.updateSettings(newSettings);
      setSettings(newSettings);
      return true;
    } catch {
      return false;
    } finally {
      setSettingsLoading(false);
    }
  };

  // --- Backups Actions ---
  const fetchBackups = useCallback(async () => {
    try {
      const [list, config] = await Promise.all([
        api.getBackups(), api.getBackupSettings()
      ]);
      setBackups(list);
      setBackupSettings(config);
    } catch (err) {
      console.error('Failed to fetch backups', err);
    }
  }, []);

  const saveBackupSettings = async (newSettings) => {
    setBackupLoading(true);
    try {
      await api.updateBackupSettings(newSettings);
      setBackupSettings(newSettings);
      return true;
    } catch (err) {
      return false;
    } finally {
      setBackupLoading(false);
    }
  };

  const createBackup = async () => {
    setBackupActionLoading(true);
    try {
      await api.createBackup();
      await fetchBackups();
      return true;
    } catch (err) {
      return false;
    } finally {
      setBackupActionLoading(false);
    }
  };

  const deleteBackup = async (filename) => {
    try {
      await api.deleteBackup(filename);
      await fetchBackups();
      return true;
    } catch (err) {
      return false;
    }
  };

  const restoreBackupFromServer = async (filename) => {
    setBackupActionLoading(true);
    try {
      await api.restoreBackupFromServer(filename);
      return true;
    } catch (err) {
      return false;
    } finally {
      setBackupActionLoading(false);
    }
  };

  const uploadAndRestoreBackup = async (file) => {
    setBackupActionLoading(true);
    try {
      await api.uploadAndRestoreBackup(file);
      return true;
    } catch (err) {
      return false;
    } finally {
      setBackupActionLoading(false);
    }
  };

  // --- Security Actions ---
  const changeMasterPassword = async (oldPassword, newPassword) => {
    setCpLoading(true);
    try {
      await api.changeMasterPassword(oldPassword, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Ошибка при смене мастер-пароля' };
    } finally {
      setCpLoading(false);
    }
  };

  const factoryReset = async () => {
    setIsResetting(true);
    try {
      await api.factoryReset();
      return true;
    } catch (err) {
      return false;
    } finally {
      setIsResetting(false);
    }
  };

  return {
    // Users
    users, userLoading, userError, fetchUsers, createUser, updateUserRole,
    // Logs
    logs, logStats, settings, settingsLoading, fetchLogs, saveSettings,
    // Backups
    backups, backupSettings, backupLoading, backupActionLoading, 
    fetchBackups, saveBackupSettings, createBackup, deleteBackup, 
    restoreBackupFromServer, uploadAndRestoreBackup,
    // Security
    cpLoading, isResetting, changeMasterPassword, factoryReset
  };
}
