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
  const [serviceFilter, setServiceFilter] = useState('');
  const [diagnosisFilter, setDiagnosisFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
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
      const searchStr = search.toLowerCase();
      const matchesName = !searchStr || (p.fullName && p.fullName.toLowerCase().includes(searchStr));
      
      const matchesIb = !ibFilter || (p.caseHistoryNumber && p.caseHistoryNumber.includes(ibFilter));
      const matchesDep = !departmentFilter || p.department === departmentFilter;

      const serviceText = p.isSvoParticipant ? 'СВО' : p.militaryStatus;
      const matchesService = !serviceFilter || (serviceText && serviceText.toLowerCase().includes(serviceFilter.toLowerCase()));

      const diagStr = diagnosisFilter.toLowerCase();
      const matchesDiag = !diagnosisFilter || getDisplayDiagnosis(p).toLowerCase().includes(diagStr);

      const matchesStatus = !statusFilter || p.status === statusFilter;

      let matchesDate = true;
      if (dateFilter) {
        const pDate = new Date(p.admissionDate).toISOString().split('T')[0];
        matchesDate = pDate === dateFilter;
      }

      return matchesName && matchesIb && matchesDep && matchesService && matchesDiag && matchesStatus && matchesDate;
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

  const uniqueIbs = Array.from(new Set(patients.map(p => p.caseHistoryNumber || ''))).filter(Boolean).sort();
  const uniqueServices = Array.from(new Set(patients.map(p => p.isSvoParticipant ? 'СВО' : (p.militaryStatus || '')))).filter(Boolean).sort();
  const uniqueDiagnoses = Array.from(new Set(patients.map(p => getDisplayDiagnosis(p)))).filter(d => d !== '—').sort();
  const uniqueDates = Array.from(new Set(patients.map(p => p.admissionDate ? new Date(p.admissionDate).toISOString().split('T')[0] : ''))).filter(Boolean).sort();

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
      </div>

      <div className="card table-wrapper" style={{ flex: 1 }}>
        {loading ? (
          <div className="p-6 text-center text-muted">Загрузка данных...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-6 text-center text-muted">Пациенты не найдены</div>
        ) : (
          <table>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '120px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('caseHistoryNumber')}>
                    № ИБ <SortIcon field="caseHistoryNumber" />
                  </div>
                  <select 
                    value={ibFilter}
                    onChange={e => setIbFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  >
                    <option value="">ВСЕ</option>
                    {uniqueIbs.map(ib => <option key={ib} value={ib}>{ib}</option>)}
                  </select>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('fullName')}>
                    ФИО <SortIcon field="fullName" />
                  </div>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '110px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                    Служба
                  </div>
                  <select 
                    value={serviceFilter}
                    onChange={e => setServiceFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  >
                    <option value="">ВСЕ</option>
                    {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '130px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('department')}>
                    Отделение <SortIcon field="department" />
                  </div>
                  <select 
                    value={departmentFilter} 
                    onChange={e => setDepartmentFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  >
                    <option value="">ВСЕ</option>
                    {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep.split(' ')[0]}</option>)}
                  </select>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                    Диагноз
                  </div>
                  <select 
                    value={diagnosisFilter}
                    onChange={e => setDiagnosisFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  >
                    <option value="">ВСЕ</option>
                    {uniqueDiagnoses.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '130px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('admissionDate')}>
                    Поступление <SortIcon field="admissionDate" />
                  </div>
                  <select 
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  >
                    <option value="">ВСЕ</option>
                    {uniqueDates.map(d => <option key={d} value={d}>{new Date(d).toLocaleDateString('ru-RU')}</option>)}
                  </select>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '120px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                    Статус
                  </div>
                  <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  >
                    <option value="">ВСЕ</option>
                    <option value="На лечении">АКТИВНЫЕ</option>
                    <option value="Выписан">ВЫПИСАНЫ</option>
                  </select>
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
