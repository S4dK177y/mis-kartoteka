import React, { useState } from 'react';
import { Key, Shield, AlertTriangle, Trash2 } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { Card, Button } from '../../components/ui';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';

export const SecurityTab = () => {
  const { changeMasterPassword, factoryReset, cpLoading, isResetting } = useAdmin();
  const [oldMasterPassword, setOldMasterPassword] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmNewMasterPassword, setConfirmNewMasterPassword] = useState('');
  const [cpMessage, setCpMessage] = useState(null);
  const [resetConfirmWord, setResetConfirmWord] = useState('');

  const handleChangeMasterPassword = async (e) => {
    e.preventDefault();
    setCpMessage(null);
    if (newMasterPassword !== confirmNewMasterPassword) {
      return setCpMessage({ type: 'error', text: 'Новые пароли не совпадают' });
    }
    if (newMasterPassword.length < 6) {
      return setCpMessage({ type: 'error', text: 'Новый пароль должен быть не менее 6 символов' });
    }
    const res = await changeMasterPassword(oldMasterPassword, newMasterPassword);
    if (res.success) {
      setCpMessage({ type: 'success', text: 'Мастер-пароль успешно изменён. Следующая разблокировка потребует новый пароль.' });
      setOldMasterPassword(''); setNewMasterPassword(''); setConfirmNewMasterPassword('');
    } else {
      setCpMessage({ type: 'error', text: res.error });
    }
  };

  const handleFactoryReset = async () => {
    if (resetConfirmWord !== 'СБРОС') {
      toast.error('Для подтверждения введите слово СБРОС (заглавными буквами)');
      return;
    }
    if (!(await confirmDialog('ВЫ УВЕРЕНЫ? Это удалит ВСЕ данные пациентов, документы, пользователей и логи без возможности восстановления!'))) {
      return;
    }
    const success = await factoryReset();
    if (success) {
      setTimeout(() => window.location.href = '/setup', 500);
    } else {
      toast.error('Ошибка при сбросе системы');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'min(420px, 100%) 1fr', gap: '1.5rem', alignItems: 'start' }} className="security-grid animate-fade-in">
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
          <h3 className="font-bold text-base m-0 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
            <Key size={18} style={{ color: 'var(--primary)' }} /> Смена Мастер-пароля
          </h3>
          <p className="text-sm text-muted m-0 mt-1" style={{ lineHeight: 1.55 }}>
            Все данные остаются нетронутыми — меняется только ключ доступа к ключу шифрования (Envelope Encryption).
          </p>
        </div>
        <div style={{ padding: '1.5rem 1.25rem' }}>
          {cpMessage && (
            <div className="mb-5 p-3 text-sm" style={{
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
            <Button type="submit" variant="danger" className="w-full" style={{ padding: '0.7rem' }} disabled={cpLoading}>
              {cpLoading ? 'Применение...' : 'Изменить мастер-пароль'}
            </Button>
          </form>
        </div>
      </Card>

      <div className="flex-col gap-4">
        <Card style={{ overflow: 'hidden', border: '1px solid #bfdbfe' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #bfdbfe', background: '#eff6ff' }}>
            <h4 className="font-bold text-base m-0 flex items-center gap-2" style={{ color: '#1e3a8a' }}>
              <Shield size={17} style={{ color: '#3b82f6' }} /> О системе шифрования
            </h4>
          </div>
          <div style={{ padding: '1rem 1.25rem', background: '#eff6ff' }} className="flex-col gap-0">
            {[
              ['Шифрование БД',             'ГОСТ Р 34.12-2018 (Кузнечик-MGM)'],
              ['Шифрование файлов',         'Гибридное (AES-256-GCM + ГОСТ Кузнечик)'],
              ['Деривация ключа',           'PBKDF2-Стрибог-512 (ГОСТ Р 34.11-2012)'],
              ['Верификация пароля',        'HMAC-Стрибог-256 (ГОСТ Р 34.11-2012)'],
              ['Детерминированный IV',      'HMAC-Стрибог-256 (для поиска по жетону)'],
              ['Случайный IV / Salt',       'Windows CNG (BCryptGenRandom)'],
              ['Защита ключа шифрования',   'Envelope Encryption (KEK → DEK)'],
              ['Хранение мастер-ключа',     'Только в RAM — никогда не пишется на диск'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center" style={{ padding: '0.45rem 0', borderBottom: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '0.82rem', color: '#3b82f6', fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: '0.82rem', color: '#1e3a8a', fontWeight: 700, textAlign: 'right', marginLeft: '1rem' }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ overflow: 'hidden', border: '1px solid #fde68a' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #fde68a', background: '#fffbeb' }}>
            <h4 className="font-bold text-base m-0 flex items-center gap-2" style={{ color: '#92400e' }}>
              <AlertTriangle size={17} style={{ color: '#f59e0b' }} /> Важно знать
            </h4>
          </div>
          <div style={{ padding: '1rem 1.25rem', background: '#fffbeb' }} className="flex-col gap-3">
            {[
              'Если мастер-пароль будет утерян — данные невозможно восстановить. Надёжно сохраните его в менеджере паролей или физическом сейфе.',
              'При каждом перезапуске сервера система блокируется и требует повторного ввода мастер-пароля.',
              'Принудительная блокировка без перезапуска доступна через иконку замка в верхней части интерфейса.',
            ].map((t, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '1rem', lineHeight: 1.4, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: '0.83rem', color: '#92400e', lineHeight: 1.6 }}>{t}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ overflow: 'hidden', border: '1px solid #fca5a5' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #fca5a5', background: '#fef2f2' }}>
            <h4 className="font-bold text-base m-0 flex items-center gap-2" style={{ color: '#991b1b' }}>
              <Trash2 size={17} style={{ color: '#ef4444' }} /> Сброс до заводских настроек
            </h4>
          </div>
          <div style={{ padding: '1rem 1.25rem', background: '#fef2f2' }} className="flex-col gap-3">
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f1d1d', lineHeight: 1.5, fontWeight: 500 }}>
              ВНИМАНИЕ! Эта операция <strong>полностью уничтожит базу данных</strong>, удалит всех пользователей, все документы с диска и сбросит настройки шифрования. 
              Восстановить данные будет <strong>невозможно</strong>.
            </p>
            <div className="flex gap-2 items-center mt-2">
              <input 
                type="text" 
                className="input-field" 
                placeholder="Введите СБРОС" 
                value={resetConfirmWord}
                onChange={e => setResetConfirmWord(e.target.value)}
                style={{ flex: 1, borderColor: '#fca5a5', background: 'white' }}
              />
              <button 
                className="btn btn-primary" 
                style={{ background: '#dc2626', borderColor: '#dc2626', padding: '0.6rem 1rem' }}
                onClick={handleFactoryReset}
                disabled={isResetting || resetConfirmWord !== 'СБРОС'}
              >
                {isResetting ? 'Сброс системы...' : 'УНИЧТОЖИТЬ ДАННЫЕ'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
