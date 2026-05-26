import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, FileText, User } from 'lucide-react';
import { api } from '../api';
import { DocumentCard, DocumentViewer } from '../components/ui';

export default function ConsultationProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState(null);

  useEffect(() => {
    fetchConsultation();
  }, [id]);

  const fetchConsultation = async () => {
    try {
      const data = await api.getConsultation(id);
      setConsultation(data);
    } catch (error) {
      console.error(error);
      alert('Ошибка загрузки приема');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот прием?')) {
      try {
        await api.deleteConsultation(id);
        navigate('/consultations');
      } catch (error) {
        alert('Ошибка при удалении');
      }
    }
  };

  if (loading) return <div className="p-6 text-center text-muted">Загрузка данных...</div>;
  if (!consultation) return <div className="p-6 text-center text-muted">Прием не найден</div>;

  const vvk = consultation.vvkConclusion;

  return (
    <div className="animate-fade-in flex-col gap-4" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem', width: '100%' }}>
      <div className="flex-col gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button className="btn btn-icon btn-outline" onClick={() => navigate('/consultations')} title="Назад к списку">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl m-0 flex items-center gap-2">
                {consultation.fullName}
              </h2>
            </div>
            <div className="text-muted text-sm flex gap-3 mt-1 flex-wrap">
              {consultation.type === 'VVK' ? (
                <span style={{ fontWeight: '700', color: vvk?.status === 'COMPLETED' ? '#4338ca' : '#b45309' }}>
                  ВВК {vvk?.status === 'COMPLETED' ? '(Завершено)' : '(В процессе)'}
                </span>
              ) : (
                <span className="text-muted">Обычный прием</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => navigate(`/consultations/${id}/edit`)}>
            <Edit size={14} /> Изменить
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={14} /> Удалить
          </button>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card p-4">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2"><User size={20} /> Данные пациента</h3>
          <div className="grid-2 gap-4">
            <div>
              <div className="text-xs text-muted mb-1">ФИО</div>
              <div className="font-semibold" style={{ fontSize: '0.9rem' }}>{consultation.fullName}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Дата рождения</div>
              <div className="font-semibold" style={{ fontSize: '0.9rem' }}>{consultation.birthDate ? new Date(consultation.birthDate).toLocaleDateString() : '—'}</div>
            </div>
            {(consultation.rank || consultation.militaryUnit) && (
              <>
                <div>
                  <div className="text-xs text-muted mb-1">Звание</div>
                  <div className="font-semibold" style={{ fontSize: '0.9rem' }}>{consultation.rank || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1">Подразделение (в/ч)</div>
                  <div className="font-semibold" style={{ fontSize: '0.9rem' }}>{consultation.militaryUnit || '—'}</div>
                </div>
              </>
            )}
            <div>
              <div className="text-xs text-muted mb-1">Статус военнослужащего</div>
              <div className="font-semibold" style={{ fontSize: '0.9rem' }}>{consultation.militaryStatus || '—'}</div>
            </div>
          </div>
        </div>

        <div className="card p-4" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2"><Calendar size={20} /> Детали приема</h3>
          <div className="grid-2 gap-4">
            <div>
              <div className="text-xs text-muted mb-1">Дата приема</div>
              <div className="font-semibold">{new Date(consultation.consultationDate).toLocaleString('ru-RU')}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Следующий визит</div>
              <div className="font-semibold" style={{ color: 'var(--primary)' }}>
                {consultation.nextConsultationDate ? new Date(consultation.nextConsultationDate).toLocaleDateString('ru-RU') : 'Не назначен'}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="text-xs text-muted mb-1">Диагноз (МКБ-10)</div>
              <div className="font-semibold">{consultation.diagnosis || '—'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="text-xs text-muted mb-1">Жалобы, анамнез, рекомендации</div>
              <div className="p-3 bg-gray-50 rounded mt-1 text-sm" style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-main)' }}>
                {consultation.notes || 'Нет записей'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {consultation.type === 'VVK' && vvk && (
        <div className="card p-4 mb-4" style={{ borderTop: '4px solid #3b82f6', boxShadow: 'var(--shadow-md)' }}>
          <h3 className="text-xl m-0 font-bold mb-4" style={{ color: '#1e293b' }}>Заключение ВВК</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
            {['neurologist', 'ophthalmologist', 'dentist', 'surgeon', 'therapist'].map(doctor => {
              const labelMap = { neurologist: 'Невролог', ophthalmologist: 'Офтальмолог', dentist: 'Стоматолог', surgeon: 'Хирург', therapist: 'Терапевт' };
              const name = `${doctor}Category`;
              return (
                <div key={doctor} className="p-3" style={{ backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div className="text-xs font-bold text-muted mb-2">{labelMap[doctor]}</div>
                  <div className="text-lg font-bold" style={{ color: vvk[name] ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {vvk[name] || '—'}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', background: vvk.status === 'COMPLETED' ? '#f0fdf4' : '#f8fafc', border: `1px solid ${vvk.status === 'COMPLETED' ? '#bbf7d0' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '1.5rem 2rem' }}>
            <h4 className="text-xl font-bold m-0" style={{ color: vvk.status === 'COMPLETED' ? '#166534' : '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Итог ВВК</h4>
            <div style={{ 
              color: vvk.status === 'COMPLETED' ? '#15803d' : '#334155', 
              background: 'white', 
              padding: '0.75rem 2.5rem', 
              borderRadius: '1rem', 
              border: `2px solid ${vvk.status === 'COMPLETED' ? '#86efac' : '#cbd5e1'}`, 
              boxShadow: 'var(--shadow-md)',
              fontSize: '1.5rem',
              fontWeight: '900',
              textAlign: 'center'
            }}>
              {vvk.medicalLeaveDays 
                ? `Отпуск по болезни: ${vvk.medicalLeaveDays} сут. (Г)`
                : `Категория ${vvk.finalCategory || '—'}`
              }
            </div>
          </div>
        </div>
      )}

      {consultation.documents && consultation.documents.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2"><FileText size={20} /> Прикрепленные файлы</h3>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {consultation.documents.map(doc => {
              const isVvkScan = vvk && doc.id === vvk.documentId;
              return (
                <DocumentCard 
                  key={doc.id} 
                  doc={doc} 
                  isVvkScan={isVvkScan}
                  onClick={(e, document) => setViewingFile(document)} 
                />
              );
            })}
          </div>
        </div>
      )}

      <DocumentViewer 
        file={viewingFile} 
        isOpen={!!viewingFile} 
        onClose={() => setViewingFile(null)} 
      />
    </div>
  );
}
