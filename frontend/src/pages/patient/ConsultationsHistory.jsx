import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, FileText } from 'lucide-react';
import { Card } from '../../components/ui';

export const ConsultationsHistory = ({ patient, consultationTypeFilter, setConsultationTypeFilter }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* History of Hospitalizations (Full Width) */}
      <Card className="p-4" style={{ gridColumn: 'span 3', marginBottom: '1rem' }}>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={20} className="text-primary" />
          <h3 className="text-lg m-0 text-primary">Предыдущие госпитализации</h3>
        </div>
        
        {(!patient.history || patient.history.length === 0) ? (
          <div className="text-center text-muted p-4" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
            <p className="m-0">История госпитализаций отсутствует</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Период</th>
                  <th style={{ padding: '10px' }}>№ ИБ</th>
                  <th style={{ padding: '10px' }}>Отделение</th>
                  <th style={{ padding: '10px' }}>Заключительный диагноз</th>
                  <th style={{ padding: '10px' }}>Статус</th>
                </tr>
              </thead>
              <tbody>
                {patient.history.map(hist => (
                  <tr key={hist.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px' }}>
                      {new Date(hist.admissionDate).toLocaleDateString()} — {hist.dischargeDate ? new Date(hist.dischargeDate).toLocaleDateString() : '...'}
                    </td>
                    <td style={{ padding: '10px', fontWeight: '500' }}>{hist.caseHistoryNumber || '—'}</td>
                    <td style={{ padding: '10px' }}>{hist.department}</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={hist.finalDiagnosis || hist.clinicalDiagnosis || 'Нет диагноза'}>
                        {hist.finalDiagnosis || hist.clinicalDiagnosis || <span className="text-muted">Нет диагноза</span>}
                      </div>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem',
                        background: hist.status === 'Выписан' ? '#dcfce3' : 'var(--primary-light)',
                        color: hist.status === 'Выписан' ? '#166534' : 'var(--primary-dark)'
                      }}>
                        {hist.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* History of Consultations (Full Width) */}
      <Card className="p-4" style={{ gridColumn: 'span 3' }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-secondary" />
            <h3 className="text-lg m-0" style={{ color: 'var(--text)' }}>История амбулаторных приемов</h3>
          </div>
          <select className="input-field" style={{ width: 'auto', padding: '6px 12px' }} value={consultationTypeFilter} onChange={e => setConsultationTypeFilter(e.target.value)}>
            <option value="ALL">Все приемы</option>
            <option value="REGULAR">Обычные</option>
            <option value="VVK">ВВК</option>
          </select>
        </div>
        
        {(!patient.consultations || patient.consultations.length === 0) ? (
          <div className="text-center text-muted p-4" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
            <p className="m-0">История приемов отсутствует</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Дата приема</th>
                  <th style={{ padding: '10px' }}>Тип</th>
                  <th style={{ padding: '10px' }}>Диагноз</th>
                  <th style={{ padding: '10px' }}>Следующий визит</th>
                </tr>
              </thead>
              <tbody>
                {patient.consultations
                  .filter(c => consultationTypeFilter === 'ALL' || c.type === consultationTypeFilter)
                  .map(consult => (
                  <tr key={consult.id} style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }} onClick={() => { window.scrollTo(0, 0); navigate(`/consultations/${consult.id}`); }}>
                    <td style={{ padding: '10px' }}>
                      {new Date(consult.consultationDate).toLocaleDateString('ru-RU')}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div className="mb-1">
                        {consult.type === 'VVK' ? (
                          <span style={{ fontWeight: '700', color: consult.vvkConclusion?.status === 'COMPLETED' ? '#4338ca' : '#b45309', fontSize: '0.8rem' }}>
                            ВВК {consult.vvkConclusion?.status === 'COMPLETED' ? '(Завершено)' : '(В процессе)'}
                          </span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>Обычный</span>
                        )}
                      </div>
                      <div style={{ maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={consult.diagnosis || 'Нет диагноза'}>
                        {consult.diagnosis || <span className="text-muted">Нет диагноза</span>}
                      </div>
                      {consult.type === 'VVK' && consult.vvkConclusion && (
                        <div className="mt-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--secondary)' }}>
                          {consult.vvkConclusion.medicalLeaveDays 
                            ? `Отпуск по болезни (${consult.vvkConclusion.medicalLeaveDays} сут.)`
                            : `Категория: ${consult.vvkConclusion.finalCategory || '—'}`
                          }
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {consult.nextConsultationDate ? new Date(consult.nextConsultationDate).toLocaleDateString('ru-RU') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
};
