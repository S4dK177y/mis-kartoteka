import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Filter, SortAsc } from 'lucide-react';
import { api } from '../api';
import { DEPARTMENTS } from './PatientForm';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ibFilter, setIbFilter] = useState('');

  const [diagnosisFilter, setDiagnosisFilter] = useState('');
  
  // Sorting
  const [sortField, setSortField] = useState('admissionDate'); 
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
    fetchPatients();
  }, []);

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

  const getDisplayDiagnosis = (p) => {
    return p.finalDiagnosis || p.clinicalDiagnosis || p.admissionDiagnosis || '—';
  };

  const getFilteredPatients = () => {
    let result = patients.filter(p => {
      // General Text Search (Full Name and IB)
      const searchStr = search.toLowerCase();
      if (searchStr && !p.fullName.toLowerCase().includes(searchStr) && !(p.caseHistoryNumber && p.caseHistoryNumber.toLowerCase().includes(searchStr))) return false;

      // Specific Filters
      if (departmentFilter && p.department !== departmentFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      
      if (ibFilter && (!p.caseHistoryNumber || !p.caseHistoryNumber.toLowerCase().includes(ibFilter.toLowerCase()))) return false;
      
      if (diagnosisFilter) {
        const diagStr = getDisplayDiagnosis(p).toLowerCase();
        if (!diagStr.includes(diagnosisFilter.toLowerCase())) return false;
      }

      return true;
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
        <div style={{ flex: 1 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Поиск по ФИО или № ИБ..."
              style={{ paddingLeft: '36px', marginBottom: 0, width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
      </div>

      <div className="card table-wrapper" style={{ flex: 1 }}>
        {loading ? (
          <div className="p-6 text-center text-muted">Загрузка данных...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-6 text-center text-muted">Пациенты не найдены</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '120px' }}>
                  <div className="flex-col gap-1">
                    <span className="flex items-center gap-1 cursor-pointer select-none hover:text-primary" onClick={() => handleSort('caseHistoryNumber')}>
                      № ИБ <SortIcon field="caseHistoryNumber" />
                    </span>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} 
                      placeholder="Фильтр..." 
                      value={ibFilter}
                      onChange={e => setIbFilter(e.target.value)}
                    />
                  </div>
                </th>
                <th>
                  <div className="flex-col gap-1">
                    <span className="flex items-center gap-1 cursor-pointer select-none hover:text-primary" onClick={() => handleSort('fullName')}>
                      ФИО <SortIcon field="fullName" />
                    </span>
                  </div>
                </th>
                <th>Служба</th>
                <th>
                  <div className="flex-col gap-1">
                    <span className="flex items-center gap-1 cursor-pointer select-none hover:text-primary" onClick={() => handleSort('department')}>
                      Отделение <SortIcon field="department" />
                    </span>
                    <select 
                      value={departmentFilter} 
                      onChange={e => setDepartmentFilter(e.target.value)}
                      className="input-field"
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      <option value="">ВСЕ</option>
                      {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep.split(' ')[0]}</option>)}
                    </select>
                  </div>
                </th>
                <th>
                  <div className="flex-col gap-1">
                    <span>Диагноз</span>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} 
                      placeholder="Фильтр МКБ/текст..." 
                      value={diagnosisFilter}
                      onChange={e => setDiagnosisFilter(e.target.value)}
                    />
                  </div>
                </th>
                <th>
                  <div className="flex-col gap-1">
                    <span className="flex items-center gap-1 cursor-pointer select-none hover:text-primary" onClick={() => handleSort('admissionDate')}>
                      Поступление <SortIcon field="admissionDate" />
                    </span>
                  </div>
                </th>
                <th style={{ width: '120px' }}>
                  <div className="flex-col gap-1">
                    <span>Статус</span>
                    <select 
                      value={statusFilter} 
                      onChange={e => setStatusFilter(e.target.value)}
                      className="input-field"
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      <option value="">ВСЕ</option>
                      <option value="На лечении">АКТИВНЫЕ</option>
                      <option value="Выписан">ВЫПИСАНЫ</option>
                    </select>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => (
                <tr key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)}>
                  <td className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{patient.caseHistoryNumber || '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary-hover)' }}>
                    <span>{patient.fullName}</span>
                    {(patient.rank || patient.militaryUnit) && (
                      <div className="text-muted mt-1" style={{ fontSize: '0.7rem', fontWeight: 400 }}>
                        {patient.rank && <span>{patient.rank}</span>}
                        {patient.rank && patient.militaryUnit && <span> • </span>}
                        {patient.militaryUnit && <span>в/ч {patient.militaryUnit}</span>}
                      </div>
                    )}
                  </td>
                  <td>
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
                  <td style={{ fontSize: '0.8rem' }}>{patient.department}</td>
                  <td style={{ fontSize: '0.75rem' }}>{getDisplayDiagnosis(patient)}</td>
                  <td className="text-muted" style={{ fontSize: '0.75rem' }}>
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
        )}
      </div>
    </div>
  );
}
