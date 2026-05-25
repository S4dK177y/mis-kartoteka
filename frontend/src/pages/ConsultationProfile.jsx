import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, FileText, Download, User } from 'lucide-react';
import { api } from '../api';

export default function ConsultationProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div className="animate-fade-in flex-col gap-6" style={{ height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>
      <div className="flex justify-between items-center bg-white p-4" style={{ borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center gap-4">
          <button className="btn btn-icon btn-outline" onClick={() => navigate('/consultations')} title="Назад к списку">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl m-0 font-bold" style={{ color: 'var(--text-main)' }}>{consultation.fullName}</h2>
            <div className="flex items-center gap-2 mt-1">
              {consultation.type === 'VVK' ? (
                vvk?.status === 'COMPLETED' ? (
                  <span className="badge" style={{ background: '#e0e7ff', color: '#4f46e5', fontSize: '0.75rem' }}>ВВК (Завершено)</span>
                ) : (
                  <span className="badge" style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.75rem' }}>ВВК (В процессе)</span>
                )
              ) : (
                <span className="badge" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Обычный прием</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => navigate(`/consultations/${id}/edit`)}>
            <Edit size={16} /> Редактировать
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={16} /> Удалить
          </button>
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="card p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2"><User size={20} /> Данные пациента</h3>
          <div className="grid-2 gap-4">
            <div>
              <div className="text-xs text-muted mb-1">ФИО</div>
              <div className="font-semibold">{consultation.fullName}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Дата рождения</div>
              <div className="font-semibold">{consultation.birthDate ? new Date(consultation.birthDate).toLocaleDateString() : '—'}</div>
            </div>
            {(consultation.rank || consultation.militaryUnit) && (
              <>
                <div>
                  <div className="text-xs text-muted mb-1">Звание</div>
                  <div className="font-semibold">{consultation.rank || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1">Подразделение (в/ч)</div>
                  <div className="font-semibold">{consultation.militaryUnit || '—'}</div>
                </div>
              </>
            )}
            <div>
              <div className="text-xs text-muted mb-1">Статус военнослужащего</div>
              <div className="font-semibold">{consultation.militaryStatus || '—'}</div>
            </div>
          </div>
        </div>

        <div className="card p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
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
        <div className="card p-6 mb-4" style={{ borderTop: '4px solid #3b82f6', boxShadow: 'var(--shadow-md)' }}>
          <h3 className="text-xl m-0 font-bold mb-6" style={{ color: '#1e293b' }}>Заключение ВВК</h3>
          
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {['neurologist', 'ophthalmologist', 'dentist', 'surgeon', 'therapist'].map(doctor => {
              const labelMap = { neurologist: 'Невролог', ophthalmologist: 'Офтальмолог', dentist: 'Стоматолог', surgeon: 'Хирург', therapist: 'Терапевт' };
              const name = `${doctor}Category`;
              return (
                <div key={doctor} className="p-4" style={{ backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div className="text-sm font-bold text-muted mb-2">{labelMap[doctor]}</div>
                  <div className="text-lg font-bold" style={{ color: vvk[name] ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {vvk[name] || '—'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-5" style={{ background: vvk.status === 'COMPLETED' ? '#f0fdf4' : '#f8fafc', border: `1px solid ${vvk.status === 'COMPLETED' ? '#bbf7d0' : 'var(--border)'}`, borderRadius: 'var(--radius-md)' }}>
            <h4 className="text-lg font-bold mb-2" style={{ color: vvk.status === 'COMPLETED' ? '#166534' : 'inherit' }}>Итог ВВК</h4>
            <div className="text-xl font-bold">
              {vvk.medicalLeaveDays 
                ? `Отпуск по болезни: ${vvk.medicalLeaveDays} суток (Г)`
                : `Категория: ${vvk.finalCategory || '—'}`
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
                <div key={doc.id} className="flex justify-between items-center p-3" style={{ background: isVvkScan ? '#f0fdf4' : 'var(--bg-main)', border: `1px solid ${isVvkScan ? '#bbf7d0' : 'var(--border)'}`, borderRadius: 'var(--radius-md)' }}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText size={20} className={isVvkScan ? "text-secondary" : "text-primary"} />
                    <div className="flex-col overflow-hidden">
                      <span className="font-semibold text-sm truncate block" style={{ color: isVvkScan ? '#166534' : 'var(--text-main)' }}>
                        {doc.originalName}
                        {isVvkScan && <span className="ml-2 text-xs opacity-75">(Скан ВВК)</span>}
                      </span>
                      <span className="text-xs text-muted">{(doc.size / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <a href={api.getDocumentUrl(doc.id)} className="btn btn-icon btn-outline" target="_blank" rel="noopener noreferrer">
                    <Download size={16} />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
