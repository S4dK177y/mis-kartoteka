import React, { useState, useEffect } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { Card, Button } from '../../components/ui';
import { ACTION_META, ENTITY_LABELS, FIELD_LABELS, formatFieldValue, HIDDEN_KEYS, COUNT_KEYS, UUID_RE } from './constants';

const ActionBadge = ({ action }) => {
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

const LogDetails = ({ detailsStr, action, entity }) => {
  if (!detailsStr) {
    if (action === 'DELETE') return <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Запись удалена из базы данных.</span>;
    if (action === 'LOGOUT') return <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Сессия завершена.</span>;
    return <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Подробная информация не записана.</span>;
  }

  let d;
  try {
    d = JSON.parse(detailsStr);
  } catch {
    return <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{detailsStr}</span>;
  }

  if (d.changes && typeof d.changes === 'object' && Object.keys(d.changes).length > 0) {
    return (
      <div className="flex-col gap-2">
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Изменённые поля</span>
        {Object.entries(d.changes).map(([field, vals]) => (
          <div key={field} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 20px 1fr', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{FIELD_LABELS[field] || field}</span>
            <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.2rem 0.5rem', borderRadius: '5px', fontSize: '0.79rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {formatFieldValue(field, vals?.old)}
            </span>
            <span style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem' }}>→</span>
            <span style={{ background: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '5px', fontSize: '0.79rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {formatFieldValue(field, vals?.new)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const countEntries = Object.entries(d).filter(([k]) => k in COUNT_KEYS);
  if (countEntries.length > 0) {
    return (
      <div className="flex-col gap-1">
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Результаты миграции</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {countEntries.map(([k, v]) => (
            <span key={k} style={{ background: '#dbeafe', color: '#1e3a8a', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: 600 }}>
              {COUNT_KEYS[k]}: {v}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (d.originalName) {
    const isUpload = action === 'UPLOAD';
    return (
      <div className="flex-col gap-1">
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isUpload ? 'Загруженный файл' : 'Удалённый файл'}
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.3rem 0.6rem', display: 'inline-block' }}>
          {d.originalName}
        </span>
      </div>
    );
  }

  const visible = Object.entries(d).filter(([k, v]) =>
    !HIDDEN_KEYS.has(k)
    && k !== 'note'
    && !(typeof v === 'string' && UUID_RE.test(v))
    && v !== null && v !== undefined
  );
  
  if (visible.length === 0) return <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Подробная информация не записана.</span>;
  
  return (
    <div className="flex-col gap-1">
      {visible.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, minWidth: '120px' }}>{FIELD_LABELS[k] || k}</span>
          <span style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text-main)' }}>{formatFieldValue(k, v)}</span>
        </div>
      ))}
    </div>
  );
};

const LogRow = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = ACTION_META[log.action] || {};
  const Icon = meta.icon || Activity;

  return (
    <>
      <tr
        onClick={() => setExpanded(e => !e)}
        style={{ cursor: 'pointer', borderBottom: expanded ? 'none' : '1px solid var(--border)', transition: 'background 0.15s' }}
      >
        <td style={{ padding: '0.75rem 1rem', width: '46px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: meta.bg || '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={15} color={meta.color || '#374151'} />
          </div>
        </td>
        <td style={{ padding: '0.75rem 0.75rem', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{new Date(log.createdAt).toLocaleDateString('ru-RU')}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>{new Date(log.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        </td>
        <td style={{ padding: '0.75rem 0.75rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>{log.user?.username || 'Система'}</span>
        </td>
        <td style={{ padding: '0.75rem 0.75rem' }}>
          <ActionBadge action={log.action} />
        </td>
        <td style={{ padding: '0.75rem 0.75rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{ENTITY_LABELS[log.entity] || log.entity}</span>
        </td>
        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <td colSpan={6} style={{ padding: '1rem 1.25rem 1rem 4.5rem', background: 'var(--bg-input)' }}>
            <LogDetails detailsStr={log.details} action={log.action} entity={log.entity} />
          </td>
        </tr>
      )}
    </>
  );
};

export const LogsTab = () => {
  const { logs, logStats, settings, settingsLoading, fetchLogs, saveSettings } = useAdmin();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [logDateFilter, setLogDateFilter] = useState('');
  const [logUserFilter, setLogUserFilter] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('');
  const [logEntityFilter, setLogEntityFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSaveSettings = () => {
    saveSettings(localSettings);
  };

  const uniqueUsers = Array.from(new Set(logs.map(l => l.user?.username || 'Система'))).sort();
  const uniqueEntities = Array.from(new Set(logs.map(l => l.entity))).sort();

  const filteredLogs = logs.filter(log => {
    const matchAction = !logActionFilter || log.action === logActionFilter;
    const matchUser = !logUserFilter || (log.user?.username || 'Система') === logUserFilter;
    const matchEntity = !logEntityFilter || log.entity === logEntityFilter;
    
    let matchDate = true;
    if (logDateFilter) {
      const logDate = new Date(log.createdAt).toISOString().split('T')[0];
      matchDate = logDate === logDateFilter;
    }
    
    return matchAction && matchUser && matchEntity && matchDate;
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'min(260px, 100%) 1fr', gap: '1.5rem', alignItems: 'start' }} className="logs-grid animate-fade-in">
      <div className="flex-col gap-4">
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
            <h4 className="font-bold text-sm m-0 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Настройки хранения</h4>
          </div>
          <div style={{ padding: '1rem 1.25rem' }} className="flex-col gap-3">
            <div className="input-group mb-0">
              <label className="input-label">Хранить логи (дней)</label>
              <input type="number" className="input-field" value={localSettings.logRetentionDays} onChange={e => setLocalSettings({ ...localSettings, logRetentionDays: e.target.value })} />
            </div>
            <div className="input-group mb-0">
              <label className="input-label">Лимит места (МБ)</label>
              <input type="number" className="input-field" value={localSettings.maxLogSpaceMb} onChange={e => setLocalSettings({ ...localSettings, maxLogSpaceMb: e.target.value })} />
            </div>
            <Button variant="primary" className="w-full" onClick={handleSaveSettings} disabled={settingsLoading}>
              {settingsLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </Card>

        <Card style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
            <h4 className="font-bold text-sm m-0 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Статистика</h4>
          </div>
          <div style={{ padding: '1rem 1.25rem' }}>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted">Всего записей:</span>
              <span className="font-bold">{logStats.totalLogs}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-sm text-muted">Объём:</span>
              <span className="font-bold" style={{ color: 'var(--primary)' }}>{(logStats.exactBytes / 1024 / 1024).toFixed(2)} МБ</span>
            </div>
            <div style={{ background: 'var(--border)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                background: 'var(--primary)', height: '100%',
                width: `${Math.min(100, (logStats.exactBytes / 1024 / 1024) / parseFloat(localSettings.maxLogSpaceMb) * 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', minWidth: '120px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Время</div>
                  <input
                    type="date"
                    value={logDateFilter}
                    onChange={e => setLogDateFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  />
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Пользователь</div>
                  <select
                    value={logUserFilter}
                    onChange={e => setLogUserFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  >
                    <option value="">Все</option>
                    {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Действие</div>
                  <select
                    value={logActionFilter}
                    onChange={e => setLogActionFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  >
                    <option value="">Все</option>
                    {Object.entries(ACTION_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Объект</div>
                  <select
                    value={logEntityFilter}
                    onChange={e => setLogEntityFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  >
                    <option value="">Все</option>
                    {uniqueEntities.map(e => <option key={e} value={e}>{ENTITY_LABELS[e] || e}</option>)}
                  </select>
                </th>
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
      </Card>
    </div>
  );
};
