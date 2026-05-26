import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui';

export const PatientSummaryCard = ({ patient }) => {
  return (
    <>
      {/* Left Column: Details */}
      <div className="flex-col gap-4" style={{ gridColumn: 'span 1' }}>
        <Card className="p-4">
          <h3 className="text-lg mb-3 text-primary">Данные</h3>
          
          <div className="flex-col gap-2 text-sm">
            <div className="flex justify-between border-b pb-1">
              <span className="text-muted">Дата рождения:</span>
              <span style={{ fontWeight: 500 }}>{new Date(patient.birthDate).toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-muted">№ в/ч:</span>
              <span style={{ fontWeight: 500 }}>{patient.militaryUnit || '—'}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-muted">Телефон:</span>
              <span style={{ fontWeight: 500 }}>{patient.phoneNumber || '—'}</span>
            </div>
            {patient.relativeRelation || patient.relativeFullName || patient.relativePhone ? (
              <div className="flex-col gap-1 border-b pb-1">
                <span className="text-muted text-xs uppercase font-bold">Близкий человек:</span>
                <div className="flex justify-between">
                  <span className="text-muted text-xs">Статус:</span>
                  <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{patient.relativeRelation || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted text-xs">ФИО:</span>
                  <span style={{ fontWeight: 500, fontSize: '0.85rem', textAlign: 'right' }}>{patient.relativeFullName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted text-xs">Телефон:</span>
                  <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{patient.relativePhone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted text-xs">Адрес:</span>
                  <span style={{ fontWeight: 500, fontSize: '0.85rem', textAlign: 'right' }}>{patient.relativeAddress || '—'}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted">Близкие:</span>
                <span style={{ fontWeight: 500, textAlign: 'right' }}>—</span>
              </div>
            )}
            <div className="flex justify-between border-b pb-1">
              <span className="text-muted">Отделение:</span>
              <span style={{ fontWeight: 600, color: 'var(--primary-hover)', textAlign: 'right' }}>{patient.department}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-muted">Статус:</span>
              <div className="flex items-center gap-2">
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: patient.status === 'На лечении' ? 'var(--primary)' : 'var(--text-muted)' }}></div>
                <span style={{ fontWeight: 600, color: patient.status === 'На лечении' ? 'var(--primary-hover)' : 'var(--text-muted)' }}>
                  {patient.status}
                </span>
              </div>
            </div>
            <div className="flex-col pb-1 border-b">
              <span className="text-muted mb-1">Поступил:</span>
              <span style={{ fontWeight: 500 }}>
                {new Date(patient.admissionDate).toLocaleDateString('ru-RU')} в {new Date(patient.admissionDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            
            {patient.status === 'Выписан' && (
              <div className="flex-col pb-1 border-b" style={{ background: 'var(--secondary-light)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                <span className="text-muted mb-1">Выписан:</span>
                <span style={{ fontWeight: 600, color: 'var(--secondary-hover)' }}>
                  {patient.dischargeDate ? `${new Date(patient.dischargeDate).toLocaleDateString('ru-RU')} в ${new Date(patient.dischargeDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}` : '—'}
                </span>
                <span className="mt-1 text-xs">{patient.dischargeDestination || 'Исход не указан'}</span>
              </div>
            )}

            <div className="flex-col mt-1">
              <span className="text-muted text-xs mb-1">Адрес:</span>
              <p>{patient.address || 'Не указан'}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg mb-3 text-primary">История отделений</h3>
          <div className="timeline mt-2">
            {patient.transfers && patient.transfers.length > 0 ? (
              [...patient.transfers].reverse().map((t, idx) => (
                <div key={t.id} className="timeline-item" style={{ marginBottom: '1rem' }}>
                  <div className="text-sm font-semibold">{t.toDepartment}</div>
                  <div className="text-xs text-muted">
                    {new Date(t.transferDate).toLocaleDateString('ru-RU')} в {new Date(t.transferDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  {idx === 0 && <div className="text-xs text-muted">(Первичное)</div>}
                </div>
              ))
            ) : (
              <p className="text-muted text-xs text-center">Нет истории</p>
            )}
          </div>
        </Card>
      </div>

      {/* Middle Column: Diagnoses */}
      <Card className="p-4" style={{ gridColumn: 'span 1' }}>
        <h3 className="text-lg mb-3 text-primary">Диагнозы</h3>
        
        <div className="flex-col gap-4">
          <div className="p-4" style={{ background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">При поступлении</div>
            <p className="text-sm m-0 leading-relaxed text-slate-800">{patient.admissionDiagnosis || 'Не установлен'}</p>
          </div>
          
          <div className="p-4 shadow-sm" style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
            <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Клинический</div>
            <p className="text-sm m-0 leading-relaxed text-slate-900" style={{ fontWeight: 500 }}>{patient.clinicalDiagnosis || 'В процессе...'}</p>
          </div>
          
          <div className="p-4" style={{ background: patient.status === 'Выписан' ? 'var(--secondary-light)' : '#f8fafc', borderRadius: 'var(--radius-md)', border: patient.status === 'Выписан' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #e2e8f0' }}>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Заключительный</div>
            <p className="text-sm m-0 leading-relaxed text-slate-800">{patient.finalDiagnosis || 'Не вынесен'}</p>
          </div>

          {patient.complications && (
            <div className="p-4 mt-2 shadow-sm" style={{ background: '#fff1f2', borderRadius: 'var(--radius-md)', border: '1px solid #fecdd3' }}>
              <div className="flex items-center gap-1 mb-2">
                <AlertCircle size={14} color="#e11d48" />
                <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Осложнения и сопутствующие</div>
              </div>
              <p className="text-sm m-0 leading-relaxed text-rose-900" style={{ whiteSpace: 'pre-wrap' }}>{patient.complications}</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};
