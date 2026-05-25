import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, SortAsc } from 'lucide-react';
import { api } from '../api';

export default function ConsultationList() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, REGULAR, VVK
  
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
      const searchStr = search.toLowerCase();
      if (searchStr && !c.fullName.toLowerCase().includes(searchStr)) return false;
      if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
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
      <div className="flex justify-between items-end mb-4 gap-4 flex-wrap">
        <div style={{ flex: 1 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Поиск по ФИО..."
              style={{ paddingLeft: '36px', marginBottom: 0, width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div>
          <select className="input-field" style={{ marginBottom: 0, minWidth: '150px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="ALL">Все приемы</option>
            <option value="REGULAR">Обычные</option>
            <option value="VVK">ВВК</option>
          </select>
        </div>
      </div>

      <div className="card table-wrapper" style={{ flex: 1 }}>
        {loading ? (
          <div className="p-6 text-center text-muted">Загрузка данных...</div>
        ) : filteredConsultations.length === 0 ? (
          <div className="p-6 text-center text-muted">Консультации не найдены</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  <div className="flex-col gap-1">
                    <span className="flex items-center gap-1 cursor-pointer select-none hover:text-primary" onClick={() => handleSort('fullName')}>
                      ФИО <SortIcon field="fullName" />
                    </span>
                  </div>
                </th>
                <th>Служба</th>
                <th>Тип</th>
                <th>Диагноз / Заключение</th>
                <th>
                  <div className="flex-col gap-1">
                    <span className="flex items-center gap-1 cursor-pointer select-none hover:text-primary" onClick={() => handleSort('consultationDate')}>
                      Дата приема <SortIcon field="consultationDate" />
                    </span>
                  </div>
                </th>
                <th>
                  <div className="flex-col gap-1">
                    <span className="flex items-center gap-1 cursor-pointer select-none hover:text-primary" onClick={() => handleSort('nextConsultationDate')}>
                      Следующий визит <SortIcon field="nextConsultationDate" />
                    </span>
                  </div>
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
                      consult.vvkConclusion?.status === 'COMPLETED' ? (
                        <span className="badge" style={{ background: '#e0e7ff', color: '#4f46e5', fontSize: '0.65rem' }}>ВВК (Завершено)</span>
                      ) : (
                        <span className="badge" style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.65rem' }}>ВВК (В процессе)</span>
                      )
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>Обычный</span>
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
