import React, { useEffect, useState } from 'react';
import { Save, FileUp } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { Card, Button } from '../../components/ui';
import { api } from '../../api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';

export const BackupsTab = () => {
  const { 
    backups, backupSettings, backupLoading, backupActionLoading, 
    fetchBackups, saveBackupSettings, createBackup, deleteBackup, 
    restoreBackupFromServer, uploadAndRestoreBackup 
  } = useAdmin();

  const [localSettings, setLocalSettings] = useState(backupSettings);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  useEffect(() => {
    setLocalSettings(backupSettings);
  }, [backupSettings]);

  const handleSaveBackupSettings = () => {
    saveBackupSettings(localSettings);
  };

  const handleCreateBackup = async () => {
    const success = await createBackup();
    if (success) toast.success('Бэкап создан');
    else toast.error('Ошибка при создании бэкапа');
  };

  const handleDeleteBackup = async (filename) => {
    if (!(await confirmDialog(`Удалить бэкап ${filename}?`))) return;
    const success = await deleteBackup(filename);
    if (success) toast.success('Бэкап удален');
    else toast.error('Ошибка при удалении');
  };

  const handleRestoreFromServer = async (filename) => {
    if (!(await confirmDialog(`ВНИМАНИЕ! Текущие данные будут перезаписаны данными из бэкапа ${filename}. Продолжить?`))) return;
    const success = await restoreBackupFromServer(filename);
    if (success) {
      window.location.href = '/locked';
    } else {
      toast.error('Ошибка при восстановлении');
    }
  };

  const handleUploadAndRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!(await confirmDialog(`ВНИМАНИЕ! Система будет восстановлена из загруженного архива. Продолжить?`))) {
      e.target.value = '';
      return;
    }
    const success = await uploadAndRestoreBackup(file);
    if (success) {
      window.location.href = '/locked';
    } else {
      toast.error('Ошибка загрузки и восстановления');
    }
  };

  const totalBackupBytes = backups.reduce((acc, b) => acc + b.size, 0);
  const totalBackupMb = (totalBackupBytes / 1024 / 1024).toFixed(2);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'min(380px, 100%) 1fr', gap: '1.5rem', alignItems: 'start' }} className="backups-grid animate-fade-in">
      <div className="flex-col gap-4">
        
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
            <h3 className="font-bold text-lg m-0 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <Save size={18} style={{ color: 'var(--primary)' }} /> Управление архивами
            </h3>
            <p className="text-sm text-muted m-0 mt-1" style={{ lineHeight: 1.55 }}>
              Полная копия базы данных, загруженных документов и настроек шифрования. 
              Восстановление из архива перезапишет текущие данные системы.
            </p>
          </div>
          <div style={{ padding: '1rem 1.25rem' }}>
            <div className="flex gap-2">
              <Button 
                variant="primary" 
                onClick={handleCreateBackup} 
                disabled={backupActionLoading}
                style={{ padding: '0.6rem', flex: 1, fontSize: '0.85rem' }}
              >
                <Save size={15} className="mr-1" style={{ display: 'inline' }} />
                {backupActionLoading ? 'Обработка...' : 'Создать сейчас'}
              </Button>
              
              <label className="btn btn-outline" style={{ padding: '0.6rem', flex: 1, fontSize: '0.85rem', textAlign: 'center', cursor: 'pointer', margin: 0 }}>
                <input type="file" accept=".zip" style={{ display: 'none' }} onChange={handleUploadAndRestore} disabled={backupActionLoading} />
                <FileUp size={15} className="mr-1" style={{ display: 'inline' }} />
                {backupActionLoading ? 'Обработка...' : 'Загрузить архив'}
              </label>
            </div>
          </div>
        </Card>

        <Card style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
            <h4 className="font-bold text-sm m-0 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Автоматические бэкапы</h4>
          </div>
          <div style={{ padding: '1rem 1.25rem' }} className="flex-col gap-3">
            <div className="flex items-center gap-2 mb-2">
              <input 
                type="checkbox" 
                id="enableBackup"
                checked={localSettings.enabled}
                onChange={e => setLocalSettings({ ...localSettings, enabled: e.target.checked })}
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="enableBackup" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Создавать автоматически</label>
            </div>
            
            <div className="input-group mb-0">
              <label className="input-label">Частота резервирования</label>
              <select 
                className="input-field" 
                value={localSettings.cron} 
                onChange={e => setLocalSettings({ ...localSettings, cron: e.target.value })} 
                disabled={!localSettings.enabled}
              >
                <option value="0 */12 * * *">Каждые 12 часов</option>
                <option value="0 0 * * *">Каждый день (ночью)</option>
                <option value="0 0 * * 0">Каждую неделю (в воскресенье)</option>
                <option value="0 0 1 * *">Каждый месяц (1-го числа)</option>
              </select>
            </div>

            <div className="input-group mb-0">
              <label className="input-label">Хранить архивов (шт.)</label>
              <input 
                type="number" 
                className="input-field" 
                value={localSettings.maxCount} 
                onChange={e => setLocalSettings({ ...localSettings, maxCount: e.target.value })} 
                disabled={!localSettings.enabled}
              />
            </div>
            
            <Button variant="primary" className="w-full mt-2" onClick={handleSaveBackupSettings} disabled={backupLoading}>
              {backupLoading ? 'Сохранение...' : 'Сохранить настройки'}
            </Button>
          </div>
        </Card>

        <Card style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
            <h4 className="font-bold text-sm m-0 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Статистика</h4>
          </div>
          <div style={{ padding: '1rem 1.25rem' }}>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted">Всего бэкапов:</span>
              <span className="font-bold">{backups.length}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-sm text-muted">Объём:</span>
              <span className="font-bold" style={{ color: 'var(--primary)' }}>{totalBackupMb} МБ</span>
            </div>
            <div style={{ background: 'var(--border)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                background: 'var(--primary)', height: '100%',
                width: `${Math.min(100, parseFloat(totalBackupMb) / 10240 * 100)}%`,
                transition: 'width 0.3s ease'
              }} title="Отображается относительно условного лимита в 10 ГБ" />
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
          <h3 className="font-bold text-lg m-0" style={{ color: 'var(--text-main)' }}>История на сервере</h3>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 12rem)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Дата создания</th>
                <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Имя файла</th>
                <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Размер</th>
                <th style={{ padding: '0.7rem 1rem', textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {backups.map(b => (
                <tr key={b.filename} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.85rem' }}>
                    <div className="flex flex-col">
                      <span>{new Date(b.createdAt).toLocaleDateString('ru-RU')}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(b.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>
                    {b.filename}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {(b.size / 1024 / 1024).toFixed(2)} МБ
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDeleteBackup(b.filename)} disabled={backupActionLoading}>Удалить</Button>
                      <a href={api.getBackupDownloadUrl(b.filename)} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', textDecoration: 'none' }} download>Скачать</a>
                      <Button variant="primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleRestoreFromServer(b.filename)} disabled={backupActionLoading}>Восстановить</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {backups.length === 0 && (
                <tr><td colSpan={4} className="text-center p-8 text-muted">Нет резервных копий</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
