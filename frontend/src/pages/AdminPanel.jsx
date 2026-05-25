import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Shield, UserPlus, Users, Activity, ChevronDown, ChevronUp, Save, Settings as SettingsIcon } from 'lucide-react';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState({ totalLogs: 0, exactBytes: 0 });
  const [settings, setSettings] = useState({ logRetentionDays: '30', maxLogSpaceMb: '50' });
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [role, setRole] = useState('DOCTOR');
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  
  const [oldMasterPassword, setOldMasterPassword] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmNewMasterPassword, setConfirmNewMasterPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  
  const [expandedLog, setExpandedLog] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'users') {
        const usersData = await api.getUsers();
        setUsers(usersData);
      } else if (activeTab === 'logs') {
        const [logsData, statsData, settingsData] = await Promise.all([
          api.getLogs(),
          api.getLogStats(),
          api.getSettings()
        ]);
        setLogs(logsData);
        setLogStats(statsData);
        if (settingsData.logRetentionDays) setSettings(prev => ({...prev, logRetentionDays: settingsData.logRetentionDays}));
        if (settingsData.maxLogSpaceMb) setSettings(prev => ({...prev, maxLogSpaceMb: settingsData.maxLogSpaceMb}));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return setError('Пароль должен быть не менее 6 символов');
    }
    setLoading(true);
    setError('');
    try {
      await api.createUser(newUsername, newPassword, role);
      setNewUsername('');
      setNewPassword('');
      fetchData();
    } catch (err) {
      setError(err.message || 'Ошибка создания пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId) => {
    try {
      await api.updateUserRole(userId, editingRole);
      setEditingUserId(null);
      fetchData();
    } catch (err) {
      alert('Ошибка при изменении роли');
    }
  };

  const saveSettings = async () => {
    setSettingsLoading(true);
    try {
      await api.updateSettings(settings);
      alert('Настройки успешно сохранены');
    } catch (err) {
      alert('Ошибка при сохранении настроек');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleChangeMasterPassword = async (e) => {
    e.preventDefault();
    if (newMasterPassword !== confirmNewMasterPassword) {
      return alert('Новые пароли не совпадают!');
    }
    if (newMasterPassword.length < 6) {
      return alert('Новый пароль должен быть не менее 6 символов');
    }
    
    setChangePasswordLoading(true);
    try {
      await api.changeMasterPassword(oldMasterPassword, newMasterPassword);
      alert('Мастер-пароль успешно изменен!');
      setOldMasterPassword('');
      setNewMasterPassword('');
      setConfirmNewMasterPassword('');
    } catch (err) {
      alert(err.message || 'Ошибка при изменении мастер-пароля');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const formatLogAction = (log) => {
    const actionMap = {
      'CREATE': 'Создание',
      'UPDATE': 'Обновление',
      'DELETE': 'Удаление',
      'UPLOAD': 'Загрузка файла'
    };
    const entityMap = {
      'Patient': 'карточки пациента',
      'User': 'пользователя',
      'Document': 'документа',
      'Consultation': 'консультации'
    };
    const actionText = actionMap[log.action] || log.action;
    const entityText = entityMap[log.entity] || log.entity;
    
    return `${actionText} ${entityText}`;
  };

  const translateField = (field) => {
    const dict = {
      role: 'Роль',
      username: 'Логин',
      status: 'Статус',
      department: 'Отделение',
      fullName: 'ФИО',
      dischargeDate: 'Дата выписки',
      finalDiagnosis: 'Закл. диагноз'
    };
    return dict[field] || field;
  };

  const formatLogDetails = (detailsStr) => {
    try {
      const details = JSON.parse(detailsStr);
      
      // If it's a simple changes object
      if (details.changes) {
        return (
          <div className="flex-col gap-2">
            {Object.entries(details.changes).map(([field, vals]) => (
              <div key={field} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 20px 1fr', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                <span className="font-medium text-muted">{translateField(field)}:</span>
                <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{String(vals.old || '—')}</span>
                <span className="text-muted text-center">➔</span>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{String(vals.new || '—')}</span>
              </div>
            ))}
          </div>
        );
      }
      
      // If it's a creation details
      if (details.username || details.fullName) {
        return (
          <div className="flex-col gap-1">
            {Object.entries(details).map(([k, v]) => (
              <div key={k} className="text-sm">
                <span className="text-muted">{translateField(k)}: </span>
                <span className="font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        );
      }

      return (
        <pre style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem', overflowX: 'auto', whiteSpace: 'pre-wrap', color: 'var(--text-main)', margin: 0 }}>
          {JSON.stringify(details, null, 2)}
        </pre>
      );
    } catch (e) {
      return <span>{detailsStr}</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '0 auto' }}>
      <div className="flex items-center gap-3 mb-6">
        <Shield size={32} className="text-primary" />
        <h1 className="text-2xl font-bold m-0 text-primary">Панель администратора</h1>
      </div>

      <div className="flex gap-4 mb-6">
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('users')}>
          <Users size={18} /> Пользователи
        </button>
        <button className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('logs')}>
          <Activity size={18} /> Логи системы
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="grid-layout-admin">
          <div className="card p-6" style={{ alignSelf: 'start' }}>
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-primary"><UserPlus size={20} /> Добавить пользователя</h3>
            
            {error && <div className="bg-danger text-white p-3 rounded-md mb-5 text-sm font-medium text-center">{error}</div>}
            
            <form onSubmit={handleCreateUser} className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Имя пользователя (Логин)</label>
                <input type="text" className="input-field" value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Пароль</label>
                <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Минимум 6 символов" />
              </div>
              <div className="input-group">
                <label className="input-label">Роль</label>
                <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="DOCTOR">Врач (DOCTOR)</option>
                  <option value="ADMIN">Администратор (ADMIN)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary mt-4 w-full" style={{ padding: '0.75rem' }} disabled={loading}>
                {loading ? 'Создание...' : 'Создать пользователя'}
              </button>
            </form>
          </div>

          <div className="card flex-col" style={{ height: 'calc(100vh - 12rem)', minHeight: '500px' }}>
            <div className="p-6 border-b" style={{ background: '#f8fafc' }}>
              <h3 className="text-xl font-bold m-0 text-primary">Список пользователей</h3>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '1rem' }}>
              <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                <thead>
                  <tr>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Пользователь</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Роль</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Создан</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)', textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ background: 'white', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-sm)' }}>
                      <td className="font-bold p-4" style={{ borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)' }}>{u.username}</td>
                      <td className="p-4">
                        {editingUserId === u.id ? (
                          <div className="flex gap-2 items-center">
                            <select className="input-field" style={{ padding: '0.2rem 0.5rem', width: 'auto' }} value={editingRole} onChange={e => setEditingRole(e.target.value)}>
                              <option value="DOCTOR">DOCTOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </div>
                        ) : (
                          <span className="badge" style={{ background: u.role === 'ADMIN' ? 'var(--primary-light)' : 'var(--bg-input)', border: '1px solid var(--border)' }}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="text-muted text-sm p-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right" style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                        {editingUserId === u.id ? (
                          <div className="flex gap-2 justify-end">
                            <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setEditingUserId(null)}>Отмена</button>
                            <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => handleUpdateRole(u.id)}><Save size={14} /> Сохранить</button>
                          </div>
                        ) : (
                          <button className="btn btn-outline text-xs" style={{ padding: '0.2rem 0.6rem' }} onClick={() => { setEditingUserId(u.id); setEditingRole(u.role); }}>Изменить роль</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="grid-layout-admin" style={{ gridTemplateColumns: '300px 1fr' }}>
          <div className="card p-6" style={{ alignSelf: 'start' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary"><SettingsIcon size={20} /> Настройки логов</h3>
            <div className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Хранить логи (дней)</label>
                <input type="number" className="input-field" value={settings.logRetentionDays} onChange={e => setSettings({...settings, logRetentionDays: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Лимит места (МБ)</label>
                <input type="number" className="input-field" value={settings.maxLogSpaceMb} onChange={e => setSettings({...settings, maxLogSpaceMb: e.target.value})} />
              </div>
              <button className="btn btn-primary w-full" onClick={saveSettings} disabled={settingsLoading}>
                {settingsLoading ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-bold text-sm text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><Shield size={16} /> Безопасность</h4>
              <form onSubmit={handleChangeMasterPassword} className="flex-col gap-3">
                <div className="input-group mb-0">
                  <input type="password" placeholder="Текущий мастер-пароль" className="input-field" value={oldMasterPassword} onChange={e => setOldMasterPassword(e.target.value)} required />
                </div>
                <div className="input-group mb-0">
                  <input type="password" placeholder="Новый мастер-пароль" className="input-field" value={newMasterPassword} onChange={e => setNewMasterPassword(e.target.value)} required />
                </div>
                <div className="input-group mb-0">
                  <input type="password" placeholder="Повторите новый пароль" className="input-field" value={confirmNewMasterPassword} onChange={e => setConfirmNewMasterPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={changePasswordLoading} style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  {changePasswordLoading ? 'Изменение...' : 'Изменить мастер-пароль'}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t">
              <h4 className="font-bold text-sm text-muted uppercase tracking-wider mb-3">Миграция шифрования</h4>
              <p className="text-xs text-muted mb-3" style={{ lineHeight: '1.4' }}>
                Пройдет по всем пациентам и консультациям в базе и зашифрует старые данные, добавленные до версии 1.5.
              </p>
              <button 
                className="btn btn-primary w-full" 
                onClick={async () => {
                  if (window.confirm('Запустить миграцию старых данных?')) {
                    try {
                      const res = await api.migrateEncryption();
                      alert(res.message || 'Миграция успешно завершена!');
                    } catch (err) {
                      alert('Ошибка: ' + (err.message || 'Неизвестная ошибка'));
                    }
                  }
                }}
              >
                Зашифровать старые данные
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-bold text-sm text-muted uppercase tracking-wider mb-3">Статистика логов</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Всего записей:</span>
                <span className="font-bold">{logStats.totalLogs}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Объем в БД:</span>
                <span className="font-bold text-primary">{(logStats.exactBytes / 1024 / 1024).toFixed(2)} МБ</span>
              </div>
              <div style={{ background: 'var(--bg-input)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--primary)', height: '100%', width: `${Math.min(100, (logStats.exactBytes / 1024 / 1024) / parseFloat(settings.maxLogSpaceMb) * 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="card flex-col" style={{ height: 'calc(100vh - 12rem)', minHeight: '600px' }}>
            <div className="p-6 border-b" style={{ background: '#f8fafc' }}>
              <h3 className="text-xl font-bold m-0 text-primary flex items-center gap-2"><Activity size={20} /> Журнал действий</h3>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '1rem' }}>
              <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                <thead>
                  <tr>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)', width: '40px' }}></th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)', width: '150px' }}>Время</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Пользователь</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Событие</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <React.Fragment key={log.id}>
                      <tr 
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)} 
                        style={{ background: 'white', boxShadow: expandedLog === log.id ? 'none' : 'var(--shadow-sm)', cursor: 'pointer' }}
                      >
                        <td className="p-4 text-center text-muted" style={{ borderRadius: expandedLog === log.id ? 'var(--radius-sm) 0 0 0' : 'var(--radius-sm) 0 0 var(--radius-sm)' }}>
                          {expandedLog === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                        <td className="text-muted text-sm font-medium p-4">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="font-bold text-primary p-4">{log.user?.username || 'Система'}</td>
                        <td className="p-4" style={{ borderRadius: expandedLog === log.id ? '0 var(--radius-sm) 0 0' : '0 var(--radius-sm) var(--radius-sm) 0' }}>
                          <div className="flex items-center gap-2">
                            <span className="badge" style={{
                              background: log.action === 'CREATE' ? '#dcfce7' : 
                                        log.action === 'UPDATE' ? '#fef9c3' : 
                                        log.action === 'DELETE' ? '#fee2e2' : 'var(--border-light)',
                              color: log.action === 'CREATE' ? '#166534' : 
                                    log.action === 'UPDATE' ? '#854d0e' : 
                                    log.action === 'DELETE' ? '#991b1b' : 'var(--text-muted)'
                            }}>
                              {log.action}
                            </span>
                            <span className="font-medium text-sm">{formatLogAction(log)}</span>
                          </div>
                        </td>
                      </tr>
                      {expandedLog === log.id && (
                        <tr>
                          <td colSpan="4" style={{ padding: 0, border: 'none' }}>
                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)', borderTop: '1px dashed var(--border)', boxShadow: 'var(--shadow-sm)', marginBottom: '0.5rem' }}>
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Детали изменения</div>
                              {log.details ? (
                                formatLogDetails(log.details)
                              ) : (
                                <span className="text-muted text-sm italic">Деталей нет</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan="4" className="text-center p-8 text-muted">Логов пока нет</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
