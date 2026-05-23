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
  const [admissionFrom, setAdmissionFrom] = useState('');
  const [dischargeFrom, setDischargeFrom] = useState('');
  
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
        (p.clinicalDiagnosis && p.clinicalDiagnosis.toLowerCase().includes(searchStr));

      if (!matchesSearch) return false;

      // Dropdown Filters
      if (departmentFilter && p.department !== departmentFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;

      // Date Filters
      if (admissionFrom) {
        if (new Date(p.admissionDate) < new Date(admissionFrom)) return false;
      }
      if (dischargeFrom) {
        if (!p.dischargeDate || new Date(p.dischargeDate) < new Date(dischargeFrom)) return false;
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
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl mb-2">Список пациентов</h2>
          <p className="text-muted">Всего записей: {filteredPatients.length}</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            className="btn btn-outline" 
            onClick={() => setSortAlpha(!sortAlpha)}
            title="Сортировка"
          >
            {sortAlpha ? <><SortAsc size={18}/> По алфавиту</> : <><Filter size={18}/> По дате добавления</>}
          </button>
          <a href={api.exportPatientsUrl} className="btn btn-outline" download>
            <Download size={18} />
            Экспорт в Excel
          </a>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="grid-3">
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Поиск</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="ФИО, жетон, № ИБ, диагноз..."
                style={{ paddingLeft: '40px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Отделение</label>
            <select className="input-field" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
              <option value="">Все отделения</option>
              {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Статус</label>
            <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Все статусы</option>
              <option value="На лечении">На лечении</option>
              <option value="Выписан">Выписан</option>
            </select>
          </div>
          
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Поступил с (включительно)</label>
            <input type="date" className="input-field" value={admissionFrom} onChange={e => setAdmissionFrom(e.target.value)} />
          </div>

          {statusFilter === 'Выписан' && (
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Выписан с (включительно)</label>
              <input type="date" className="input-field" value={dischargeFrom} onChange={e => setDischargeFrom(e.target.value)} />
            </div>
          )}
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
                <th>Отделение</th>
                <th>Клинический диагноз</th>
                <th>Поступление</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => (
                <tr key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)}>
                  <td className="text-muted text-sm">
                    {patient.tokenNumber && <div>Ж: {patient.tokenNumber}</div>}
                    {patient.caseHistoryNumber && <div>ИБ: {patient.caseHistoryNumber}</div>}
                    {!patient.tokenNumber && !patient.caseHistoryNumber && '—'}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--primary-hover)' }}>{patient.fullName}</td>
                  <td>{patient.department}</td>
                  <td className="text-sm">{patient.clinicalDiagnosis || '—'}</td>
                  <td className="text-sm text-muted">
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
