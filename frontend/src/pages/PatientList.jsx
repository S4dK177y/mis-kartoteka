import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Filter, SortAsc, SortDesc } from 'lucide-react';
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
  
  // Sorting
  const [sortAlpha, setSortAlpha] = useState(false); // false = chronological, true = A-Z

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

  const getFilteredPatients = () => {
    let result = patients.filter(p => {
      // Text Search
      const searchStr = search.toLowerCase();
      const matchesSearch = 
        p.fullName.toLowerCase().includes(searchStr) || 
        (p.tokenNumber && p.tokenNumber.toLowerCase().includes(searchStr)) ||
        (p.caseHistoryNumber && p.caseHistoryNumber.toLowerCase().includes(searchStr)) ||
        (p.clinicalDiagnosis && p.clinicalDiagnosis.toLowerCase().includes(searchStr)) ||
        (p.admissionDiagnosis && p.admissionDiagnosis.toLowerCase().includes(searchStr)) ||
        (p.finalDiagnosis && p.finalDiagnosis.toLowerCase().includes(searchStr));

      if (!matchesSearch) return false;
      if (departmentFilter && p.department !== departmentFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;

      return true;
    });

    if (sortAlpha) {
      result.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    return result;
  };

  const filteredPatients = getFilteredPatients();

  const getDisplayDiagnosis = (p) => {
    return p.finalDiagnosis || p.clinicalDiagnosis || p.admissionDiagnosis || '—';
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-4 gap-4 flex-wrap">
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Поиск по ФИО, номеру, диагнозу..."
              style={{ paddingLeft: '36px', marginBottom: 0 }}
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

      <div className="card table-wrapper">
        {loading ? (
          <div className="p-6 text-center text-muted">Загрузка данных...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-6 text-center text-muted">Пациенты не найдены</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Идентификаторы</th>
                <th>ФИО</th>
                <th>
                  <select 
                    value={departmentFilter} 
                    onChange={e => setDepartmentFilter(e.target.value)}
                    style={{ background: 'transparent', border: 'none', fontWeight: 600, color: 'inherit', outline: 'none', cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.75rem', padding: 0 }}
                  >
                    <option value="">ВСЕ ОТДЕЛЕНИЯ</option>
                    {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                  </select>
                </th>
                <th>Диагноз</th>
                <th>Поступление</th>
                <th>
                  <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ background: 'transparent', border: 'none', fontWeight: 600, color: 'inherit', outline: 'none', cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.75rem', padding: 0 }}
                  >
                    <option value="">ВСЕ СТАТУСЫ</option>
                    <option value="На лечении">НА ЛЕЧЕНИИ</option>
                    <option value="Выписан">ВЫПИСАН</option>
                  </select>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => (
                <tr key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)}>
                  <td className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {patient.tokenNumber && <div>Ж: {patient.tokenNumber}</div>}
                    {patient.caseHistoryNumber && <div>ИБ: {patient.caseHistoryNumber}</div>}
                    {!patient.tokenNumber && !patient.caseHistoryNumber && '—'}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--primary-hover)' }}>{patient.fullName}</td>
                  <td>{patient.department}</td>
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
