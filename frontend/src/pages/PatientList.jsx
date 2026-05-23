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
  const [tokenFilter, setTokenFilter] = useState('');
  const [diagnosisFilter, setDiagnosisFilter] = useState('');
  
  // Sorting
  const [sortAlpha, setSortAlpha] = useState(false); 

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
      // General Text Search (Full Name mostly, since others have specific filters now, but keep for convenience)
      const searchStr = search.toLowerCase();
      if (searchStr && !p.fullName.toLowerCase().includes(searchStr)) return false;

      // Specific Filters
      if (departmentFilter && p.department !== departmentFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      
      if (ibFilter && (!p.caseHistoryNumber || !p.caseHistoryNumber.toLowerCase().includes(ibFilter.toLowerCase()))) return false;
      if (tokenFilter && (!p.tokenNumber || !p.tokenNumber.toLowerCase().includes(tokenFilter.toLowerCase()))) return false;
      
      if (diagnosisFilter) {
        const diagStr = getDisplayDiagnosis(p).toLowerCase();
        if (!diagStr.includes(diagnosisFilter.toLowerCase())) return false;
      }

      return true;
    });

    if (sortAlpha) {
      result.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

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
              placeholder="Поиск по ФИО пациента..."
              style={{ paddingLeft: '36px', marginBottom: 0, width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            className="btn btn-outline" 
            onClick={() => setSortAlpha(!sortAlpha)}
            title="Сортировка"
          >
            {sortAlpha ? <><SortAsc size={16}/> Алфавит</> : <><Filter size={16}/> Дата</>}
          </button>
          <a href={api.exportPatientsUrl} className="btn btn-outline" download>
            <Download size={16} />
            Экспорт
          </a>
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
                    <span>№ ИБ</span>
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
                <th style={{ width: '120px' }}>
                  <div className="flex-col gap-1">
                    <span>Жетон</span>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} 
                      placeholder="Фильтр..." 
                      value={tokenFilter}
                      onChange={e => setTokenFilter(e.target.value)}
                    />
                  </div>
                </th>
                <th>ФИО</th>
                <th>
                  <div className="flex-col gap-1">
                    <span>Отделение</span>
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
                <th>Поступление</th>
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
                  <td className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{patient.tokenNumber || '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary-hover)' }}>
                    {patient.fullName}
                    {(patient.rank || patient.militaryUnit) && (
                      <div className="text-muted mt-1" style={{ fontSize: '0.7rem', fontWeight: 400 }}>
                        {patient.rank && <span>{patient.rank}</span>}
                        {patient.rank && patient.militaryUnit && <span> • </span>}
                        {patient.militaryUnit && <span>в/ч {patient.militaryUnit}</span>}
                      </div>
                    )}
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
