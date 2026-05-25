import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, SortAsc } from 'lucide-react';
import { api } from '../api';

export default function ConsultationList() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filters
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // '', REGULAR, VVK
  const [serviceFilter, setServiceFilter] = useState('');
  const [diagnosisFilter, setDiagnosisFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [nextDateFilter, setNextDateFilter] = useState('');
  
  // Sorting
  const [sortField, setSortField] = useState('consultationDate'); 
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <SortAsc size={12} style={{opacity: 0.3, cursor: 'pointer'}} />;
    return <SortAsc size={12} style={{transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none', color: 'var(--primary)', cursor: 'pointer', transition: 'transform 0.2s'}} />;
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const data = await api.getConsultations();
      setConsultations(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredConsultations = () => {
    let result = consultations.filter(c => {
      const nameStr = nameFilter.toLowerCase();
      if (nameFilter && (!c.fullName || !c.fullName.toLowerCase().includes(nameStr))) return false;
      
      if (typeFilter && c.type !== typeFilter) return false;

      const serviceText = c.militaryStatus || '';
      if (serviceFilter && (!serviceText || !serviceText.toLowerCase().includes(serviceFilter.toLowerCase()))) return false;

      const diagStr = (c.diagnosis || c.notes || '').toLowerCase();
      if (diagnosisFilter && !diagStr.includes(diagnosisFilter.toLowerCase())) return false;

      if (dateFilter) {
        const cDate = new Date(c.consultationDate).toISOString().split('T')[0];
        if (cDate !== dateFilter) return false;
      }

      if (nextDateFilter) {
        if (!c.nextConsultationDate) return false;
        const nDate = new Date(c.nextConsultationDate).toISOString().split('T')[0];
        if (nDate !== nextDateFilter) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (sortField === 'fullName') {
        valA = valA || '';
        valB = valB || '';
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortField === 'consultationDate' || sortField === 'nextConsultationDate') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

    return result;
  };

  const filteredConsultations = getFilteredConsultations();

  return (
    <div className="animate-fade-in flex-col" style={{ height: '100%' }}>
      <div className="card table-wrapper" style={{ flex: 1 }}>
        {loading ? (
          <div className="p-6 text-center text-muted">Загрузка данных...</div>
        ) : filteredConsultations.length === 0 ? (
          <div className="p-6 text-center text-muted">Консультации не найдены</div>
        ) : (
          <table>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('fullName')}>
                    ФИО <SortIcon field="fullName" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Фильтр..." 
                    value={nameFilter}
                    onChange={e => setNameFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  />
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '110px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                    Служба
                  </div>
                  <input 
                    type="text" 
                    placeholder="Фильтр..." 
                    value={serviceFilter}
                    onChange={e => setServiceFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  />
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '120px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                    Тип
                  </div>
                  <select 
                    value={typeFilter} 
                    onChange={e => setTypeFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  >
                    <option value="">Все</option>
                    <option value="REGULAR">Обычный</option>
                    <option value="VVK">ВВК</option>
                  </select>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                    Диагноз / Заключение
                  </div>
                  <input 
                    type="text" 
                    placeholder="Фильтр..." 
                    value={diagnosisFilter}
                    onChange={e => setDiagnosisFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  />
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '130px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('consultationDate')}>
                    Дата приема <SortIcon field="consultationDate" />
                  </div>
                  <input 
                    type="date" 
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  />
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '130px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('nextConsultationDate')}>
                    Следующий визит <SortIcon field="nextConsultationDate" />
                  </div>
                  <input 
                    type="date" 
                    value={nextDateFilter}
                    onChange={e => setNextDateFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredConsultations.map(consult => (
                <tr key={consult.id} onClick={() => navigate(`/consultations/${consult.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-hover)' }}>
                    <span>{consult.fullName}</span>
                    {(consult.rank || consult.militaryUnit) && (
                      <div className="text-muted mt-1" style={{ fontSize: '0.7rem', fontWeight: 400 }}>
                        {consult.rank && <span>{consult.rank}</span>}
                        {consult.rank && consult.militaryUnit && <span> • </span>}
                        {consult.militaryUnit && <span>в/ч {consult.militaryUnit}</span>}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center flex-wrap gap-1">
                      {consult.militaryStatus === 'Контракт' && consult.isSvoParticipant && (
                        <span className="badge" style={{ background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>СВО</span>
                      )}
                      {consult.militaryStatus === 'Контракт' && !consult.isSvoParticipant && (
                        <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>КОНТРАКТ</span>
                      )}
                      {consult.militaryStatus === 'Призыв' && (
                        <span className="badge" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>ПРИЗЫВ</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {consult.type === 'VVK' ? (
                      <span style={{ fontWeight: '700', color: consult.vvkConclusion?.status === 'COMPLETED' ? '#4338ca' : '#b45309', fontSize: '0.8rem' }}>
                        ВВК {consult.vvkConclusion?.status === 'COMPLETED' ? '(Завершено)' : '(В процессе)'}
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>Обычный</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>
                    <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={consult.diagnosis || 'Нет диагноза'}>
                      {consult.diagnosis || '—'}
                    </div>
                    {consult.type === 'VVK' && consult.vvkConclusion && (
                      <div className="mt-1" style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--secondary)' }}>
                        {consult.vvkConclusion.medicalLeaveDays 
                          ? `Отпуск по болезни (${consult.vvkConclusion.medicalLeaveDays} сут.)`
                          : `Категория: ${consult.vvkConclusion.finalCategory || '—'}`
                        }
                      </div>
                    )}
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {new Date(consult.consultationDate).toLocaleDateString('ru-RU')}
                    <br/>
                    {new Date(consult.consultationDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {consult.nextConsultationDate ? (
                      <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                        {new Date(consult.nextConsultationDate).toLocaleDateString('ru-RU')}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
