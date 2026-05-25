import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import {
  Shield, UserPlus, Users, Activity, Save, ChevronDown, ChevronUp,
  Lock, Key, Trash2, UserCheck, LogIn, LogOut, FileUp, FileMinus,
  Edit, ArrowLeftRight, Settings, AlertTriangle
} from 'lucide-react';

// --- Helpers ---

const ACTION_META = {
  CREATE:   { label: 'Создание',         color: '#166534', bg: '#dcfce7', icon: UserPlus },
  UPDATE:   { label: 'Обновление',       color: '#92400e', bg: '#fef3c7', icon: Edit },
  DELETE:   { label: 'Удаление',         color: '#991b1b', bg: '#fee2e2', icon: Trash2 },
  UPLOAD:   { label: 'Загрузка файла',   color: '#1e3a8a', bg: '#dbeafe', icon: FileUp },
  TRANSFER: { label: 'Перевод',          color: '#5b21b6', bg: '#ede9fe', icon: ArrowLeftRight },
  LOGIN:    { label: 'Вход в систему',   color: '#065f46', bg: '#d1fae5', icon: LogIn },
  LOGOUT:   { label: 'Выход из системы', color: '#374151', bg: '#f3f4f6', icon: LogOut },
  SYSTEM:   { label: 'Системное',        color: '#1e3a8a', bg: '#dbeafe', icon: Settings },
};

const ENTITY_LABELS = {
  Patient:      'Пациент',
  Consultation: 'Консультация',
  User:         'Пользователь',
  Document:     'Документ',
};

const FIELD_LABELS = {
  fullName:            'ФИО',
  rank:                'Звание',
  militaryUnit:        'В/ч',
  militaryStatus:      'Статус службы',
  department:          'Отделение',
  status:              'Статус',
  admissionDiagnosis:  'Диагноз при поступлении',
  clinicalDiagnosis:   'Клинический диагноз',
  finalDiagnosis:      'Заключительный диагноз',
  complications:       'Осложнения',
  dischargeDestination:'Место выписки',
  dischargeDate:       'Дата выписки',
  admissionDate:       'Дата поступления',
  birthDate:           'Дата рождения',
  caseHistoryNumber:   'Номер ИБ',
  tokenNumber:         'Жетон',
  isSvoParticipant:    'Участник СВО',
  diagnosis:           'Диагноз',
  username:            'Логин',
  role:                'Роль',
  newRole:             'Новая роль',
};

const formatFieldValue = (key, val) => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Да' : 'Нет';
  if (key.toLowerCase().includes('date') && typeof val === 'string' && val.includes('T')) {
    return new Date(val).toLocaleString('ru-RU');
  }
  return String(val);
};

// --- Sub-components ---

const Badge = ({ action }) => {
  const meta = ACTION_META[action] || { label: action, color: '#374151', bg: '#f3f4f6' };
  return (
    <span style={{
      background: meta.bg,
      color: meta.color,
      fontSize: '0.7rem',
      fontWeight: 700,
      padding: '0.2rem 0.55rem',
      borderRadius: '6px',
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {meta.label}
    </span>
  );
};

const LogDetails = ({ detailsStr }) => {
  if (!detailsStr) return <span className="text-muted" style={{ fontSize: '0.8rem' }}>Детали отсутствуют</span>;
  try {
    const d = JSON.parse(detailsStr);
    if (d.changes && typeof d.changes === 'object') {
      return (
        <div className="flex-col gap-2">
          {Object.entries(d.changes).map(([field, vals]) => (
            <div key={field} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 18px 1fr', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{FIELD_LABELS[field] || field}</span>
              <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.15rem 0.45rem', borderRadius: '5px', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formatFieldValue(field, vals?.old)}
              </span>
              <span style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.8rem' }}>→</span>
              <span style={{ background: '#dcfce7', color: '#166534', padding: '0.15rem 0.45rem', borderRadius: '5px', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formatFieldValue(field, vals?.new)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    // Flat key/value display
    const filtered = Object.entries(d).filter(([k]) => k !== 'note');
    if (filtered.length === 0) return <span className="text-muted" style={{ fontSize: '0.8rem' }}>Без деталей</span>;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {filtered.map(([k, v]) => (
          <span key={k} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.15rem 0.5rem', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{FIELD_LABELS[k] || k}: </span>
            <span style={{ fontWeight: 500 }}>{formatFieldValue(k, v)}</span>
          </span>
        ))}
      </div>
    );
  } catch {
    return <span style={{ fontSize: '0.8rem' }}>{detailsStr}</span>;
  }
};

const LogRow = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = ACTION_META[log.action] || {};
  const Icon = meta.icon || Activity;

  return (
    <>
      <tr
        onClick={() => setExpanded(e => !e)}
        style={{ cursor: 'pointer', borderBottom: expanded ? 'none' : '1px solid var(--border)' }}
        className="hover:bg-surface-hover"
      >
        <td style={{ padding: '0.75rem 1rem', width: '36px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: meta.bg || '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon size={14} color={meta.color || '#374151'} />
          </div>
        </td>
        <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {new Date(log.createdAt).toLocaleDateString('ru-RU')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {new Date(log.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </td>
        <td style={{ padding: '0.75rem 0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>
            {log.user?.username || 'Система'}
          </span>
        </td>
        <td style={{ padding: '0.75rem 0.5rem' }}>
          <Badge action={log.action} />
        </td>
        <td style={{ padding: '0.75rem 0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {ENTITY_LABELS[log.entity] || log.entity}
          </span>
        </td>
        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <td colSpan={6} style={{ padding: '0 1rem 1rem 1rem', background: 'var(--bg-input)' }}>
            <LogDetails detailsStr={log.details} />
          </td>
        </tr>
      )}
    </>
  );
};

// --- Main Component ---

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');

  // Users tab
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('DOCTOR');
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState('');

  // Security tab
  const [oldMasterPassword, setOldMasterPassword] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmNewMasterPassword, setConfirmNewMasterPassword] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const [cpMessage, setCpMessage] = useState(null); // { type: 'success'|'error', text }

  // Logs tab
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState({ totalLogs: 0, exactBytes: 0 });
  const [settings, setSettings] = useState({ logRetentionDays: '30', maxLogSpaceMb: '50' });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    const data = await api.getUsers();
    setUsers(data);
  }, []);

  const fetchLogs = useCallback(async () => {
    const [logsData, statsData, settingsData] = await Promise.all([
      api.getLogs(), api.getLogStats(), api.getSettings()
    ]);
    setLogs(logsData);
    setLogStats(statsData);
    if (settingsData.logRetentionDays) setSettings(p => ({ ...p, logRetentionDays: settingsData.logRetentionDays }));
    if (settingsData.maxLogSpaceMb) setSettings(p => ({ ...p, maxLogSpaceMb: settingsData.maxLogSpaceMb }));
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers().catch(console.error);
    if (activeTab === 'logs') fetchLogs().catch(console.error);
  }, [activeTab]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return setUserError('Пароль должен быть не менее 6 символов');
    setUserLoading(true);
    setUserError('');
    try {
      await api.createUser(newUsername, newPassword, newRole);
      setNewUsername(''); setNewPassword(''); setNewRole('DOCTOR');
      fetchUsers();
    } catch (err) {
      setUserError(err.message || 'Ошибка создания пользователя');
    } finally {
      setUserLoading(false);
    }
  };

  const handleUpdateRole = async (userId) => {
    try {
      await api.updateUserRole(userId, editingRole);
      setEditingUserId(null);
      fetchUsers();
    } catch {
      alert('Ошибка при изменении роли');
    }
  };

  const handleChangeMasterPassword = async (e) => {
    e.preventDefault();
    setCpMessage(null);
    if (newMasterPassword !== confirmNewMasterPassword) return setCpMessage({ type: 'error', text: 'Новые пароли не совпадают' });
    if (newMasterPassword.length < 6) return setCpMessage({ type: 'error', text: 'Новый пароль должен быть не менее 6 символов' });
    setCpLoading(true);
    try {
      await api.changeMasterPassword(oldMasterPassword, newMasterPassword);
      setCpMessage({ type: 'success', text: 'Мастер-пароль успешно изменён. Следующая разблокировка потребует новый пароль.' });
      setOldMasterPassword(''); setNewMasterPassword(''); setConfirmNewMasterPassword('');
    } catch (err) {
      setCpMessage({ type: 'error', text: err.message || 'Ошибка при смене мастер-пароля' });
    } finally {
      setCpLoading(false);
    }
  };

  const saveSettings = async () => {
    setSettingsLoading(true);
    try {
      await api.updateSettings(settings);
      alert('Настройки успешно сохранены');
    } catch {
      alert('Ошибка при сохранении настроек');
    } finally {
      setSettingsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchAction = !logActionFilter || log.action === logActionFilter;
    const matchText = !logFilter || (log.user?.username || '').toLowerCase().includes(logFilter.toLowerCase())
      || (log.entity || '').toLowerCase().includes(logFilter.toLowerCase());
    return matchAction && matchText;
  });

  const TAB_BTN = (id, label, Icon) => (
    <button
      className={`btn ${activeTab === id ? 'btn-primary' : 'btn-outline'}`}
      onClick={() => setActiveTab(id)}
      style={{ gap: '0.4rem' }}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield size={28} className="text-primary" />
        <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--primary)' }}>Панель администратора</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {TAB_BTN('users', 'Пользователи', Users)}
        {TAB_BTN('security', 'Безопасность', Lock)}
        {TAB_BTN('logs', 'Журнал аудита', Activity)}
      </div>

      {/* ======== USERS TAB ======== */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Create user form */}
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <UserPlus size={18} /> Добавить пользователя
            </h3>
            {userError && (
              <div className="mb-4 p-3 text-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger)' }}>
                {userError}
              </div>
            )}
            <form onSubmit={handleCreateUser} className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Логин</label>
                <input type="text" className="input-field" value={newUsername} onChange={e => setNewUsername(e.target.value)} required placeholder="Введите логин" />
              </div>
              <div className="input-group">
                <label className="input-label">Пароль</label>
                <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Минимум 6 символов" />
              </div>
              <div className="input-group">
                <label className="input-label">Роль</label>
                <select className="input-field" value={newRole} onChange={e => setNewRole(e.target.value)}>
                  <option value="DOCTOR">Врач (DOCTOR)</option>
                  <option value="ADMIN">Администратор (ADMIN)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2" style={{ padding: '0.7rem' }} disabled={userLoading}>
                {userLoading ? 'Создание...' : 'Создать пользователя'}
              </button>
            </form>
          </div>

          {/* Users list */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="p-5 border-b" style={{ background: 'var(--bg-input)' }}>
              <h3 className="font-bold text-lg m-0" style={{ color: 'var(--text-main)' }}>Список пользователей</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Логин</th>
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Роль</th>
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Добавлен</th>
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.9rem' }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: u.role === 'ADMIN' ? 'var(--primary-light)' : 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {u.role === 'ADMIN' ? <Shield size={14} color="var(--primary)" /> : <UserCheck size={14} color="var(--text-muted)" />}
                        </div>
                        {u.username}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {editingUserId === u.id ? (
                        <select className="input-field" style={{ padding: '0.2rem 0.5rem', width: 'auto', fontSize: '0.82rem' }} value={editingRole} onChange={e => setEditingRole(e.target.value)}>
                          <option value="DOCTOR">DOCTOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      ) : (
                        <span style={{ background: u.role === 'ADMIN' ? 'var(--primary-light)' : 'var(--bg-input)', color: u.role === 'ADMIN' ? 'var(--primary)' : 'var(--text-muted)', border: '1px solid var(--border)', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {editingUserId === u.id ? (
                        <div className="flex gap-2 justify-end">
                          <button className="btn btn-outline" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setEditingUserId(null)}>Отмена</button>
                          <button className="btn btn-primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleUpdateRole(u.id)}>
                            <Save size={13} /> Сохранить
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-outline" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => { setEditingUserId(u.id); setEditingRole(u.role); }}>
                          Изменить роль
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="text-center p-8 text-muted">Пользователи не найдены</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======== SECURITY TAB ======== */}
      {activeTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Change master password */}
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <Key size={18} /> Смена Мастер-пароля
            </h3>
            <p className="text-sm text-muted mb-5" style={{ lineHeight: 1.6 }}>
              Используется алгоритм конвертного шифрования (Envelope Encryption). Все данные базы при этом остаются нетронутыми — меняется только ключ доступа к ключу шифрования.
            </p>
            {cpMessage && (
              <div className="mb-4 p-3 text-sm" style={{
                background: cpMessage.type === 'success' ? '#dcfce7' : 'var(--danger-light)',
                color: cpMessage.type === 'success' ? '#166534' : 'var(--danger)',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${cpMessage.type === 'success' ? '#86efac' : 'var(--danger)'}`,
                lineHeight: 1.5
              }}>
                {cpMessage.text}
              </div>
            )}
            <form onSubmit={handleChangeMasterPassword} className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Текущий мастер-пароль</label>
                <input type="password" className="input-field" value={oldMasterPassword} onChange={e => setOldMasterPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
              </div>
              <div className="input-group">
                <label className="input-label">Новый мастер-пароль</label>
                <input type="password" className="input-field" value={newMasterPassword} onChange={e => setNewMasterPassword(e.target.value)} required placeholder="Минимум 6 символов" autoComplete="new-password" />
              </div>
              <div className="input-group">
                <label className="input-label">Повторите новый пароль</label>
                <input type="password" className="input-field" value={confirmNewMasterPassword} onChange={e => setConfirmNewMasterPassword(e.target.value)} required placeholder="Повторите новый пароль" autoComplete="new-password" />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.7rem', background: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={cpLoading}>
                {cpLoading ? 'Применение...' : 'Изменить мастер-пароль'}
              </button>
            </form>
          </div>

          {/* Encryption info */}
          <div className="flex-col gap-4">
            <div className="card p-5" style={{ border: '1px solid #bfdbfe', background: '#eff6ff' }}>
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: '#1e3a8a' }}>
                <Shield size={16} /> О системе шифрования
              </h4>
              <div className="flex-col gap-2">
                {[
                  ['Алгоритм', 'AES-256-GCM'],
                  ['Производная ключа', 'PBKDF2 (100 000 итераций)'],
                  ['Детерминированное шифрование', 'HMAC-SHA256 IV'],
                  ['Шифрование ключа (KEK)', 'Envelope Encryption'],
                  ['Ключ в памяти', 'RAM only — не сохраняется на диске'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between" style={{ borderBottom: '1px solid #bfdbfe', paddingBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>{k}</span>
                    <span style={{ fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5" style={{ border: '1px solid #fde68a', background: '#fffbeb' }}>
              <h4 className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: '#92400e' }}>
                <AlertTriangle size={16} /> Важно знать
              </h4>
              <ul className="flex-col gap-1" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  'Если мастер-пароль будет утерян — данные невозможно восстановить.',
                  'При перезапуске сервера система блокируется и требует повторного ввода пароля.',
                  'Принудительная блокировка доступна через иконку замка в шапке интерфейса.',
                ].map((t, i) => (
                  <li key={i} style={{ fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5, paddingLeft: '0.5rem', borderLeft: '2px solid #fbbf24' }}>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ======== LOGS TAB ======== */}
      {activeTab === 'logs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Sidebar */}
          <div className="flex-col gap-4">
            {/* Filters */}
            <div className="card p-5">
              <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted">Фильтры</h4>
              <div className="flex-col gap-3">
                <div className="input-group mb-0">
                  <label className="input-label">Пользователь / объект</label>
                  <input type="text" className="input-field" placeholder="Поиск..." value={logFilter} onChange={e => setLogFilter(e.target.value)} />
                </div>
                <div className="input-group mb-0">
                  <label className="input-label">Тип действия</label>
                  <select className="input-field" value={logActionFilter} onChange={e => setLogActionFilter(e.target.value)}>
                    <option value="">Все</option>
                    {Object.entries(ACTION_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Log settings */}
            <div className="card p-5">
              <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted">Настройки логов</h4>
              <div className="flex-col gap-3">
                <div className="input-group mb-0">
                  <label className="input-label">Хранить логи (дней)</label>
                  <input type="number" className="input-field" value={settings.logRetentionDays} onChange={e => setSettings({ ...settings, logRetentionDays: e.target.value })} />
                </div>
                <div className="input-group mb-0">
                  <label className="input-label">Лимит места (МБ)</label>
                  <input type="number" className="input-field" value={settings.maxLogSpaceMb} onChange={e => setSettings({ ...settings, maxLogSpaceMb: e.target.value })} />
                </div>
                <button className="btn btn-primary w-full" onClick={saveSettings} disabled={settingsLoading}>
                  {settingsLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="card p-5">
              <h4 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted">Статистика</h4>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted">Всего записей:</span>
                <span className="font-bold">{logStats.totalLogs}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-sm text-muted">Объём:</span>
                <span className="font-bold" style={{ color: 'var(--primary)' }}>{(logStats.exactBytes / 1024 / 1024).toFixed(2)} МБ</span>
              </div>
              <div style={{ background: 'var(--bg-input)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  background: 'var(--primary)', height: '100%',
                  width: `${Math.min(100, (logStats.exactBytes / 1024 / 1024) / parseFloat(settings.maxLogSpaceMb) * 100)}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Log table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="p-5 border-b flex justify-between items-center" style={{ background: 'var(--bg-input)' }}>
              <h3 className="font-bold text-lg m-0 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <Activity size={18} /> Журнал аудита
              </h3>
              <span className="text-sm text-muted">{filteredLogs.length} из {logs.length}</span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 18rem)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                    <th style={{ width: '46px' }} />
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Время</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Пользователь</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Действие</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Объект</th>
                    <th style={{ width: '36px' }} />
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => <LogRow key={log.id} log={log} />)}
                  {filteredLogs.length === 0 && (
                    <tr><td colSpan={6} className="text-center p-10 text-muted">Логов не найдено</td></tr>
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
