import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, UserCheck, Save } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { Card, Button, Badge } from '../../components/ui';

export const UsersTab = () => {
  const { users, userLoading, userError, fetchUsers, createUser, updateUserRole } = useAdmin();
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('DOCTOR');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (newPassword.length < 6) return setLocalError('Пароль должен быть не менее 6 символов');
    const res = await createUser(newUsername, newPassword, newRole);
    if (res.success) {
      setNewUsername('');
      setNewPassword('');
      setNewRole('DOCTOR');
    }
  };

  const handleUpdateRole = async (userId) => {
    const success = await updateUserRole(userId, editingRole);
    if (success) setEditingUserId(null);
  };

  const error = localError || userError;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'min(340px, 100%) 1fr', gap: '1.5rem', alignItems: 'start' }} className="users-grid animate-fade-in">
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
          <UserPlus size={18} /> Добавить пользователя
        </h3>
        {error && (
          <div className="mb-4 p-3 text-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger)' }}>
            {error}
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
          <Button type="submit" variant="primary" className="w-full mt-2" style={{ padding: '0.7rem' }} disabled={userLoading}>
            {userLoading ? 'Создание...' : 'Создать пользователя'}
          </Button>
        </form>
      </Card>

      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
          <h3 className="font-bold text-lg m-0" style={{ color: 'var(--text-main)' }}>Список пользователей</h3>
        </div>
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th>Логин</th>
                <th>Роль</th>
                <th>Добавлен</th>
                <th style={{ textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
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
                      <Badge variant={u.role === 'ADMIN' ? 'active' : 'archived'} style={{ padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                        {u.role}
                      </Badge>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    {editingUserId === u.id ? (
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setEditingUserId(null)}>Отмена</Button>
                        <Button variant="primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleUpdateRole(u.id)}>
                          <Save size={13} /> Сохранить
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => { setEditingUserId(u.id); setEditingRole(u.role); }}>
                        Изменить роль
                      </Button>
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
      </Card>
    </div>
  );
};
