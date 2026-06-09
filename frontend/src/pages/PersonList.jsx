import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SortAsc, Activity, Stethoscope } from 'lucide-react';
import { api } from '../api';
import { useTableFilters } from '../hooks/useTableFilters';
import TableFilter from '../components/ui/TableFilter';

export default function PersonList() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Search
  const [search, setSearch] = useState('');
  
  // Sorting
  const [sortField, setSortField] = useState('latestEncounterDate'); 
  const [sortOrder, setSortOrder] = useState('desc');

  const columnsConfig = useMemo(() => [
    { key: 'fullName' },
    { key: 'birthDate', getValue: p => p.birthDate ? new Date(p.birthDate).toLocaleDateString('ru-RU') : '' },
    { key: 'service', getValue: p => p.militaryStatus || '' },
    { key: 'latestEncounterDate', getValue: p => p.latestEncounterDate ? new Date(p.latestEncounterDate).toLocaleDateString('ru-RU') : '' }
  ], []);

  const {
    filters,
    filteredData: hookFilteredData,
    getUniqueValues,
    handleFilterToggle,
    handleSelectAll,
    handleClearAll,
    resetAllFilters
  } = useTableFilters(persons, columnsConfig);

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
    fetchPersons();
  }, []);

  const fetchPersons = async () => {
    try {
      const data = await api.getPersons();
      setPersons(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPersons = () => {
    let result = hookFilteredData.filter(p => {
      const searchStr = search.toLowerCase();
      if (searchStr && !p.fullName.toLowerCase().includes(searchStr)) return false;
      return true;
    });

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (sortField === 'fullName') {
        valA = valA || '';
        valB = valB || '';
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortField === 'latestEncounterDate') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

    return result;
  };

  const filteredPersons = getFilteredPersons();

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
        ) : filteredPersons.length === 0 ? (
          <div className="p-6 text-center text-muted">Пациенты не найдены</div>
        ) : (
          <div className="table-responsive" style={{ height: '100%', overflowY: 'auto' }}>
            <table className="table" style={{ borderBottom: 'none' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <tr>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('fullName')}>
                    ФИО <SortIcon field="fullName" />
                  </div>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '150px' }}>
                  <div className="flex items-center justify-between gap-1">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Дата рождения
                    </div>
                    <TableFilter colKey="birthDate" filters={filters} getUniqueValues={getUniqueValues} onFilterToggle={handleFilterToggle} onSelectAll={handleSelectAll} onClearAll={handleClearAll} />
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
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '180px' }}>
                  <div className="flex items-center justify-between gap-1">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('latestEncounterDate')}>
                      Последнее обращение <SortIcon field="latestEncounterDate" />
                    </div>
                    <TableFilter colKey="latestEncounterDate" filters={filters} getUniqueValues={getUniqueValues} onFilterToggle={handleFilterToggle} onSelectAll={handleSelectAll} onClearAll={handleClearAll} />
                  </div>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', width: '120px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Госпитализаций
                  </div>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', width: '120px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Консультаций
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPersons.map(person => (
                <tr key={person.personId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/persons/${person.personId}`)}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-hover)', borderRight: '1px solid var(--border)' }}>
                    <span>{person.fullName}</span>
                    {(person.rank || person.militaryUnit) && (
                      <div className="text-muted mt-1" style={{ fontSize: '0.7rem', fontWeight: 400 }}>
                        {person.rank && <span>{person.rank}</span>}
                        {person.rank && person.militaryUnit && <span> • </span>}
                        {person.militaryUnit && <span>в/ч {person.militaryUnit}</span>}
                      </div>
                    )}
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.85rem', borderRight: '1px solid var(--border)' }}>
                    {person.birthDate ? new Date(person.birthDate).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td style={{ borderRight: '1px solid var(--border)' }}>
                    <div className="flex items-center flex-wrap gap-1">
                      {person.militaryStatus === 'Контракт' && person.isSvoParticipant && (
                        <span className="badge" style={{ background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>СВО</span>
                      )}
                      {person.militaryStatus === 'Контракт' && !person.isSvoParticipant && (
                        <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>КОНТРАКТ</span>
                      )}
                      {person.militaryStatus === 'Призыв' && (
                        <span className="badge" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>ПРИЗЫВ</span>
                      )}
                    </div>
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.75rem', borderRight: '1px solid var(--border)' }}>
                    {person.latestEncounterDate ? new Date(person.latestEncounterDate).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td className="text-center" style={{ borderRight: '1px solid var(--border)' }}>
                    {person.hospitalizationsCount > 0 ? (
                      <span className="badge badge-active" style={{ minWidth: '40px' }}>
                        <Activity size={12} className="mr-1" /> {person.hospitalizationsCount}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-center">
                    {person.consultationsCount > 0 ? (
                      <span className="badge badge-success" style={{ minWidth: '40px', background: 'var(--secondary-light)', color: 'var(--secondary-hover)' }}>
                        <Stethoscope size={12} className="mr-1" /> {person.consultationsCount}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
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
