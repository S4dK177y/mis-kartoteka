import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Activity, FileText } from 'lucide-react';
import { api } from '../api';

export default function PersonProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerson();
  }, [id]);

  async function fetchPerson() {
    try {
      setLoading(true);
      const data = await api.getPersonProfile(id);
      setPerson(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">Загрузка данных...</div>;
  if (!person) return <div className="p-8 text-center text-danger">Человек не найден</div>;

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <button className="btn btn-outline" style={{ alignSelf: 'flex-start', padding: '0.4rem 0.8rem' }} onClick={() => navigate('/persons')}>
        <ArrowLeft size={16} /> К списку всех пациентов
      </button>

      {/* Main Info Card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-primary m-0">{person.fullName}</h2>
                <div className="flex gap-2">
                  {person.militaryStatus === 'Контракт' && person.isSvoParticipant && (
                    <span className="badge" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>СВО</span>
                  )}
                  {person.militaryStatus === 'Контракт' && !person.isSvoParticipant && (
                    <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>Контракт</span>
                  )}
                  {person.militaryStatus === 'Призыв' && (
                    <span className="badge" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>Призыв</span>
                  )}
                </div>
              </div>
              <div className="text-muted flex items-center gap-2 text-sm">
                {person.birthDate && (
                  <span style={{ fontWeight: 500 }}>{new Date(person.birthDate).toLocaleDateString('ru-RU')}</span>
                )}
                {(person.rank || person.militaryUnit || person.tokenNumber) && <span>•</span>}
                {person.rank && <span>{person.rank}</span>}
                {person.militaryUnit && <span>в/ч {person.militaryUnit}</span>}
                {person.tokenNumber && <span>Жетон: {person.tokenNumber}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid-3 gap-4">
          <div className="flex-col gap-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">Контакты пациента</div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Телефон:</span>
              <span className="font-medium">{person.phoneNumber || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Адрес:</span>
              <span className="font-medium text-right" style={{ maxWidth: '200px' }}>{person.address || '—'}</span>
            </div>
          </div>
          
          <div className="flex-col gap-2" style={{ gridColumn: 'span 2' }}>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">Контакты близкого человека</div>
            {person.relativeRelation || person.relativeFullName || person.relativePhone ? (
              <div className="grid-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Кем приходится:</span>
                  <span className="font-medium">{person.relativeRelation || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">ФИО:</span>
                  <span className="font-medium text-right">{person.relativeFullName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Телефон:</span>
                  <span className="font-medium">{person.relativePhone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Адрес:</span>
                  <span className="font-medium text-right">{person.relativeAddress || '—'}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted">Нет данных о близких</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-layout-admin" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Hospitalizations */}
        <div className="card flex-col">
          <div className="p-4 border-b" style={{ background: '#f8fafc' }}>
            <h3 className="text-lg font-bold m-0 text-primary flex items-center gap-2"><Activity size={18} /> История госпитализаций</h3>
          </div>
          <div className="p-4">
            <div className="table-wrapper">
              <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                <thead>
                  <tr>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>№ ИБ</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Дата поступления</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Отделение</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Дата выписки</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {person.hospitalizations.map(h => (
                    <tr key={h.id} style={{ background: 'white', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} onClick={() => navigate(`/patients/${h.id}`)}>
                      <td className="p-4 font-medium" style={{ borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)' }}>
                        {h.caseHistoryNumber || '—'}
                      </td>
                      <td className="p-4 text-sm text-muted">
                        {new Date(h.admissionDate).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="p-4 text-sm">{h.department}</td>
                      <td className="p-4 text-sm text-muted">
                        {h.dischargeDate ? new Date(h.dischargeDate).toLocaleDateString('ru-RU') : '—'}
                      </td>
                      <td className="p-4" style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                        <span className={`badge ${h.status === 'На лечении' ? 'badge-active' : 'badge-archived'}`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {person.hospitalizations.length === 0 && (
                    <tr><td colSpan="5" className="text-center p-8 text-muted">Нет записей о госпитализациях</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Consultations */}
        <div className="card flex-col">
          <div className="p-4 border-b" style={{ background: '#f8fafc' }}>
            <h3 className="text-lg font-bold m-0 text-primary flex items-center gap-2"><FileText size={18} /> История амбулаторных приемов</h3>
          </div>
          <div className="p-4">
            <div className="table-wrapper">
              <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                <thead>
                  <tr>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Дата приема</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Диагноз / Заметки</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Следующий визит</th>
                  </tr>
                </thead>
                <tbody>
                  {person.consultations.map(c => (
                    <tr key={c.id} style={{ background: 'white', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} onClick={() => navigate(`/consultations/${c.id}/edit`)}>
                      <td className="p-4 font-medium" style={{ borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)' }}>
                        {new Date(c.consultationDate).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="p-4 text-sm">
                        {c.diagnosis && <div className="font-bold">{c.diagnosis}</div>}
                        {c.notes && <div className="text-muted mt-1 line-clamp-2" title={c.notes}>{c.notes}</div>}
                        {!c.diagnosis && !c.notes && <span className="text-muted">—</span>}
                      </td>
                      <td className="p-4 text-sm" style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                        {c.nextConsultationDate ? new Date(c.nextConsultationDate).toLocaleDateString('ru-RU') : '—'}
                      </td>
                    </tr>
                  ))}
                  {person.consultations.length === 0 && (
                    <tr><td colSpan="3" className="text-center p-8 text-muted">Нет записей об амбулаторных приемах</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
