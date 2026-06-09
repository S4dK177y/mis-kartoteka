import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, SortAsc } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTableFilters } from '../hooks/useTableFilters';
import TableFilter from '../components/ui/TableFilter';

const getTypeLabel = (type) => {
  const map = { PRIMARY: 'Первичный', SECONDARY: 'Повторный', PREVENTIVE: 'Профилактический', VVK: 'ВВК' };
  return map[type] || type;
};

export default function ConsultationList() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search
  const [search, setSearch] = useState('');
  
  // Sorting
  const [sortField, setSortField] = useState('consultationDate'); 
  const [sortOrder, setSortOrder] = useState('desc');

  const columnsConfig = useMemo(() => [
    { key: 'fullName' },
    { key: 'service', getValue: c => c.militaryStatus || '' },
    { key: 'type', getValue: c => getTypeLabel(c.type) },
    { key: 'diagnosis', getValue: c => c.diagnosis || c.notes || '' },
    { key: 'doctor', getValue: c => c.doctor ? (c.doctor.fullName || c.doctor.username) : '' },
    { key: 'consultationDate', getValue: c => c.consultationDate ? new Date(c.consultationDate).toLocaleDateString('ru-RU') : '' },
    { key: 'nextConsultationDate', getValue: c => c.nextConsultationDate ? new Date(c.nextConsultationDate).toLocaleDateString('ru-RU') : '' }
  ], []);

  const {
    filters,
    filteredData: hookFilteredData,
    getUniqueValues,
    handleFilterToggle,
    handleSelectAll,
    handleClearAll,
    resetAllFilters
  } = useTableFilters(consultations, columnsConfig);

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
    let result = hookFilteredData.filter(c => {
      const searchStr = search.toLowerCase();
      if (searchStr && (!c.fullName || !c.fullName.toLowerCase().includes(searchStr))) return false;
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
        <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
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
          {Object.keys(filters).length > 0 && (
            <button 
              className="btn btn-outline"
              onClick={resetAllFilters}
            >
              Сбросить фильтры ({Object.keys(filters).length})
            </button>
          )}
        </div>
      </div>

      <div className="card table-wrapper" style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div className="p-6 text-center text-muted">Загрузка данных...</div>
        ) : filteredConsultations.length === 0 ? (
          <div className="p-6 text-center text-muted">Консультации не найдены</div>
        ) : (
          <div className="table-responsive" style={{ height: '100%', overflowY: 'auto' }}>
            <table className="table" style={{ borderBottom: 'none' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <tr>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>
                  <div className="flex items-center justify-between gap-1">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('fullName')}>
                      ФИО <SortIcon field="fullName" />
                    </div>
                  </div>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '130px' }}>
                  <div className="flex items-center justify-between gap-1">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Служба
                    </div>
                    <TableFilter colKey="service" filters={filters} getUniqueValues={getUniqueValues} onFilterToggle={handleFilterToggle} onSelectAll={handleSelectAll} onClearAll={handleClearAll} />
                  </div>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '120px' }}>
                  <div className="flex items-center justify-between gap-1">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Тип
                    </div>
                    <TableFilter colKey="type" filters={filters} getUniqueValues={getUniqueValues} onFilterToggle={handleFilterToggle} onSelectAll={handleSelectAll} onClearAll={handleClearAll} />
                  </div>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>
                  <div className="flex items-center justify-between gap-1">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Диагноз / Заключение
                    </div>
                    <TableFilter colKey="diagnosis" filters={filters} getUniqueValues={getUniqueValues} onFilterToggle={handleFilterToggle} onSelectAll={handleSelectAll} onClearAll={handleClearAll} />
                  </div>
                </th>
                {user?.role === 'ADMIN' && (
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '120px' }}>
                    <div className="flex items-center justify-between gap-1">
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Врач
                      </div>
                      <TableFilter colKey="doctor" filters={filters} getUniqueValues={getUniqueValues} onFilterToggle={handleFilterToggle} onSelectAll={handleSelectAll} onClearAll={handleClearAll} />
                    </div>
                  </th>
                )}
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '150px' }}>
                  <div className="flex items-center justify-between gap-1">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('consultationDate')}>
                      Дата приема <SortIcon field="consultationDate" />
                    </div>
                    <TableFilter colKey="consultationDate" filters={filters} getUniqueValues={getUniqueValues} onFilterToggle={handleFilterToggle} onSelectAll={handleSelectAll} onClearAll={handleClearAll} />
                  </div>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '150px' }}>
                  <div className="flex items-center justify-between gap-1">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('nextConsultationDate')}>
                      Следующий визит <SortIcon field="nextConsultationDate" />
                    </div>
                    <TableFilter colKey="nextConsultationDate" filters={filters} getUniqueValues={getUniqueValues} onFilterToggle={handleFilterToggle} onSelectAll={handleSelectAll} onClearAll={handleClearAll} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredConsultations.map(consult => (
                <tr key={consult.id} onClick={() => navigate(`/consultations/${consult.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-hover)', borderRight: '1px solid var(--border)' }}>
                    <span>{consult.fullName}</span>
                    {(consult.rank || consult.militaryUnit) && (
                      <div className="text-muted mt-1" style={{ fontSize: '0.7rem', fontWeight: 400 }}>
                        {consult.rank && <span>{consult.rank}</span>}
                        {consult.rank && consult.militaryUnit && <span> • </span>}
                        {consult.militaryUnit && <span>в/ч {consult.militaryUnit}</span>}
                      </div>
                    )}
                  </td>
                  <td style={{ borderRight: '1px solid var(--border)' }}>
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
                  <td style={{ borderRight: '1px solid var(--border)' }}>
                    {consult.type === 'VVK' ? (
                      <span style={{ fontWeight: '700', color: consult.vvkConclusion?.status === 'COMPLETED' ? '#4338ca' : '#b45309', fontSize: '0.8rem' }}>
                        ВВК {consult.vvkConclusion?.status === 'COMPLETED' ? '(Завершено)' : '(В процессе)'}
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>{getTypeLabel(consult.type)}</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.75rem', borderRight: '1px solid var(--border)' }}>
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
                  {user?.role === 'ADMIN' && (
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>
                      {consult.doctor ? (consult.doctor.fullName || consult.doctor.username) : '—'}
                    </td>
                  )}
                  <td className="text-muted" style={{ fontSize: '0.75rem', borderRight: '1px solid var(--border)' }}>
                    {new Date(consult.consultationDate).toLocaleDateString('ru-RU')}
                    <br/>
                    {new Date(consult.consultationDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.75rem', borderRight: '1px solid var(--border)' }}>
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
          </div>
        )}
      </div>
    </div>
  );
}
