import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, SortAsc } from 'lucide-react';
import { api } from '../api';
import { DEPARTMENTS } from '../constants';
import { useTableFilters } from '../hooks/useTableFilters';
import TableFilter from '../components/ui/TableFilter';

const SortIcon = ({ field, sortField, sortOrder }) => {
  if (sortField !== field) return <SortAsc size={12} style={{opacity: 0.3, cursor: 'pointer'}} />;
  return <SortAsc size={12} style={{transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none', color: 'var(--primary)', cursor: 'pointer', transition: 'transform 0.2s'}} />;
};

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Search
  const [search, setSearch] = useState('');
  
  // Sorting
  const [sortField, setSortField] = useState('admissionDate'); 
  const [sortOrder, setSortOrder] = useState('desc');

  const getDisplayDiagnosis = (p) => {
    return p.finalDiagnosis || p.clinicalDiagnosis || p.admissionDiagnosis || '—';
  };

  const columnsConfig = useMemo(() => [
    { key: 'caseHistoryNumber' },
    { key: 'service', getValue: p => p.isSvoParticipant ? 'СВО' : (p.militaryStatus || '') },
    { key: 'department' },
    { key: 'diagnosis', getValue: getDisplayDiagnosis },
    { key: 'admissionDate', getValue: p => p.admissionDate ? new Date(p.admissionDate).toLocaleDateString('ru-RU') : '' },
    { key: 'status' }
  ], []);

  const {
    filters,
    filteredData: hookFilteredData,
    getUniqueValues,
    handleFilterToggle,
    handleSelectAll,
    handleClearAll,
    resetAllFilters
  } = useTableFilters(patients, columnsConfig);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const getFilteredPatients = () => {
    let result = hookFilteredData.filter(p => {
      const searchStr = search.toLowerCase();
      return !searchStr || (p.fullName && p.fullName.toLowerCase().includes(searchStr));
    });

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (sortField === 'fullName' || sortField === 'department' || sortField === 'caseHistoryNumber') {
        valA = valA || '';
        valB = valB || '';
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortField === 'admissionDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

    return result;
  };

  const filteredPatients = getFilteredPatients();

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
        ) : filteredPatients.length === 0 ? (
          <div className="p-6 text-center text-muted">Пациенты не найдены</div>
        ) : (
          <div className="table-responsive" style={{ height: '100%', overflowY: 'auto' }}>
            <table className="table" style={{ borderBottom: 'none' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <tr>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '120px' }}>
                  <div className="flex items-center justify-between gap-1">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('caseHistoryNumber')}>
                      № ИБ <SortIcon field="caseHistoryNumber" sortField={sortField} sortOrder={sortOrder} />
                    </div>
                    <TableFilter colKey="caseHistoryNumber" filters={filters} getUniqueValues={getUniqueValues} onFilterToggle={handleFilterToggle} onSelectAll={handleSelectAll} onClearAll={handleClearAll} />
                  </div>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('fullName')}>
                    ФИО <SortIcon field="fullName" sortField={sortField} sortOrder={sortOrder} />
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
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '150px' }}>
                  <div className="flex items-center justify-between gap-1">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('department')}>
                      Отделение <SortIcon field="department" sortField={sortField} sortOrder={sortOrder} />
                    </div>
                    <TableFilter colKey="department" filters={filters} getUniqueValues={getUniqueValues} onFilterToggle={handleFilterToggle} onSelectAll={handleSelectAll} onClearAll={handleClearAll} />
                  </div>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>
                  <div className="flex items-center justify-between gap-1">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Диагноз
                    </div>
                    <TableFilter colKey="diagnosis" filters={filters} getUniqueValues={getUniqueValues} onFilterToggle={handleFilterToggle} onSelectAll={handleSelectAll} onClearAll={handleClearAll} />
                  </div>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '140px' }}>
                  <div className="flex items-center justify-between gap-1">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('admissionDate')}>
                      Поступление <SortIcon field="admissionDate" sortField={sortField} sortOrder={sortOrder} />
                    </div>
                    <TableFilter colKey="admissionDate" filters={filters} getUniqueValues={getUniqueValues} onFilterToggle={handleFilterToggle} onSelectAll={handleSelectAll} onClearAll={handleClearAll} />
                  </div>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '120px' }}>
                  <div className="flex items-center justify-between gap-1">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Статус
                    </div>
                    <TableFilter colKey="status" filters={filters} getUniqueValues={getUniqueValues} onFilterToggle={handleFilterToggle} onSelectAll={handleSelectAll} onClearAll={handleClearAll} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => (
                <tr key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)} style={{ cursor: 'pointer' }}>
                  <td className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 500, borderRight: '1px solid var(--border)' }}>{patient.caseHistoryNumber || '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary-hover)', borderRight: '1px solid var(--border)' }}>
                    <span>{patient.fullName}</span>
                    {(patient.rank || patient.militaryUnit) && (
                      <div className="text-muted mt-1" style={{ fontSize: '0.7rem', fontWeight: 400 }}>
                        {patient.rank && <span>{patient.rank}</span>}
                        {patient.rank && patient.militaryUnit && <span> • </span>}
                        {patient.militaryUnit && <span>в/ч {patient.militaryUnit}</span>}
                      </div>
                    )}
                  </td>
                  <td style={{ borderRight: '1px solid var(--border)' }}>
                    <div className="flex items-center flex-wrap gap-1">
                      {patient.militaryStatus === 'Контракт' && patient.isSvoParticipant && (
                        <span className="badge" style={{ background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>СВО</span>
                      )}
                      {patient.militaryStatus === 'Контракт' && !patient.isSvoParticipant && (
                        <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>КОНТРАКТ</span>
                      )}
                      {patient.militaryStatus === 'Призыв' && (
                        <span className="badge" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>ПРИЗЫВ</span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', borderRight: '1px solid var(--border)' }}>{patient.department}</td>
                  <td style={{ fontSize: '0.75rem', borderRight: '1px solid var(--border)' }}>{getDisplayDiagnosis(patient)}</td>
                  <td className="text-muted" style={{ fontSize: '0.75rem', borderRight: '1px solid var(--border)' }}>
                    {new Date(patient.admissionDate).toLocaleDateString('ru-RU')}
                    <br/>
                    {new Date(patient.admissionDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td>
                    <span className={`badge ${patient.status === 'На лечении' ? 'badge-active' : 'badge-archived'}`}>
                      {patient.status}
                    </span>
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
