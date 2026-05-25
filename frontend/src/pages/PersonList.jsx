import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SortAsc, Activity, Stethoscope } from 'lucide-react';
import { api } from '../api';

export default function PersonList() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState('');
  const [birthDateFilter, setBirthDateFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [encounterDateFilter, setEncounterDateFilter] = useState('');
  
  // Sorting
  const [sortField, setSortField] = useState('latestEncounterDate'); 
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
    let result = persons.filter(p => {
      const searchStr = search.toLowerCase();
      if (searchStr && !p.fullName.toLowerCase().includes(searchStr)) return false;

      if (birthDateFilter) {
         if (!p.birthDate) return false;
         const bDate = new Date(p.birthDate).toISOString().split('T')[0];
         if (bDate !== birthDateFilter) return false;
      }

      const serviceText = p.militaryStatus || '';
      if (serviceFilter && !serviceText.toLowerCase().includes(serviceFilter.toLowerCase())) return false;

      if (encounterDateFilter) {
         if (!p.latestEncounterDate) return false;
         const eDate = new Date(p.latestEncounterDate).toISOString().split('T')[0];
         if (eDate !== encounterDateFilter) return false;
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

  // Determine where to navigate: if they only have consultations, maybe navigate to consultation list with filter?
  // But wait, "Из карточки человека в этом реестре можно будет увидеть всю историю его госпитализаций и консультаций."
  // Wait, I need a PersonProfile view, or we can just navigate to PatientProfile, but pass personId to show everything.
  const uniqueBirthDates = Array.from(new Set(persons.map(p => p.birthDate ? new Date(p.birthDate).toISOString().split('T')[0] : ''))).filter(Boolean).sort();
  const uniqueServices = Array.from(new Set(persons.map(p => p.militaryStatus || ''))).filter(Boolean).sort();
  const uniqueEncounterDates = Array.from(new Set(persons.map(p => p.latestEncounterDate ? new Date(p.latestEncounterDate).toISOString().split('T')[0] : ''))).filter(Boolean).sort();

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
        ) : filteredPersons.length === 0 ? (
          <div className="p-6 text-center text-muted">Пациенты не найдены</div>
        ) : (
          <table>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('fullName')}>
                    ФИО <SortIcon field="fullName" />
                  </div>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '130px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                    Дата рождения
                  </div>
                  <select 
                    value={birthDateFilter}
                    onChange={e => setBirthDateFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  >
                    <option value="">Все</option>
                    {uniqueBirthDates.map(d => <option key={d} value={d}>{new Date(d).toLocaleDateString('ru-RU')}</option>)}
                  </select>
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
                    <option value="">Все</option>
                    {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '150px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }} className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('latestEncounterDate')}>
                    Последнее обращение <SortIcon field="latestEncounterDate" />
                  </div>
                  <select 
                    value={encounterDateFilter}
                    onChange={e => setEncounterDateFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', outline: 'none', background: 'var(--bg-input)' }}
                  >
                    <option value="">Все</option>
                    {uniqueEncounterDates.map(d => <option key={d} value={d}>{new Date(d).toLocaleDateString('ru-RU')}</option>)}
                  </select>
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
                  <td style={{ fontWeight: 600, color: 'var(--primary-hover)' }}>
                    <span>{person.fullName}</span>
                    {(person.rank || person.militaryUnit) && (
                      <div className="text-muted mt-1" style={{ fontSize: '0.7rem', fontWeight: 400 }}>
                        {person.rank && <span>{person.rank}</span>}
                        {person.rank && person.militaryUnit && <span> • </span>}
                        {person.militaryUnit && <span>в/ч {person.militaryUnit}</span>}
                      </div>
                    )}
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {person.birthDate ? new Date(person.birthDate).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td>
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
                  <td className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {person.latestEncounterDate ? new Date(person.latestEncounterDate).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td className="text-center">
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
        )}
      </div>
    </div>
  );
}
