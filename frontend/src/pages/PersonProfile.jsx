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

  const fetchPerson = async () => {
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
    <div className="animate-fade-in flex-col gap-6" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <button className="btn btn-outline" style={{ alignSelf: 'flex-start', padding: '0.4rem 0.8rem' }} onClick={() => navigate('/persons')}>
        <ArrowLeft size={16} /> К списку всех пациентов
      </button>

      {/* Main Info Card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '50%', color: 'var(--primary)' }}>
            <User size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary m-0">{person.fullName}</h2>
            <div className="text-muted mt-1 flex items-center gap-2 text-sm">
              {person.birthDate && (
                <span>{new Date(person.birthDate).toLocaleDateString('ru-RU')}</span>
              )}
              {(person.rank || person.militaryUnit) && <span>•</span>}
              {person.rank && <span>{person.rank}</span>}
              {person.militaryUnit && <span>в/ч {person.militaryUnit}</span>}
            </div>
          </div>
        </div>

        <div className="grid-layout" style={{ gap: '1rem 2rem' }}>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Служба</div>
            <div className="flex items-center flex-wrap gap-2">
              {person.militaryStatus === 'Контракт' && person.isSvoParticipant && (
                <span className="badge" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>СВО</span>
              )}
              {person.militaryStatus === 'Контракт' && !person.isSvoParticipant && (
                <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>Контракт</span>
              )}
              {person.militaryStatus === 'Призыв' && (
                <span className="badge" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>Призыв</span>
              )}
              {person.tokenNumber && <span className="font-medium text-sm">Жетон: {person.tokenNumber}</span>}
              {!person.militaryStatus && !person.tokenNumber && <span className="text-muted text-sm">—</span>}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Контакты и адрес</div>
            <div className="font-medium text-sm mb-1">📞 {person.phoneNumber || 'Телефон не указан'}</div>
            <div className="font-medium text-sm mb-1">👥 {person.relativeContact || 'Близкие не указаны'}</div>
            <div className="font-medium text-sm text-muted">🏠 {person.address || 'Адрес не указан'}</div>
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
                      <td className="p-4" style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                        <span className={`badge ${h.status === 'На лечении' ? 'badge-active' : 'badge-archived'}`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {person.hospitalizations.length === 0 && (
                    <tr><td colSpan="4" className="text-center p-8 text-muted">Нет записей о госпитализациях</td></tr>
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
