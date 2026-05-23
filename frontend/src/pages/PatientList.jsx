import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, FileText, Activity } from 'lucide-react';
import { api } from '../api';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(search.toLowerCase()) || 
    (p.diagnosis && p.diagnosis.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl">Список пациентов</h2>
        
        <div className="flex gap-4 w-full" style={{ maxWidth: '600px' }}>
          <div className="input-group" style={{ margin: 0, flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Поиск по ФИО или диагнозу..."
              style={{ paddingLeft: '40px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <a href={api.exportPatientsUrl} className="btn btn-outline" download>
            <Download size={18} />
            Экспорт
          </a>
        </div>
      </div>

      <div className="card table-wrapper mt-4">
        {loading ? (
          <div className="p-6 text-center text-muted">Загрузка данных...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-6 text-center text-muted">Пациенты не найдены</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Дата рождения</th>
                <th>Диагноз</th>
                <th>Дата поступления</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => (
                <tr key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)}>
                  <td style={{ fontWeight: 500, color: 'var(--primary-hover)' }}>{patient.fullName}</td>
                  <td>{new Date(patient.birthDate).toLocaleDateString('ru-RU')}</td>
                  <td>{patient.diagnosis || '—'}</td>
                  <td>{new Date(patient.admissionDate).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <span className={`badge ${patient.status === 'Активен' ? 'badge-active' : 'badge-archived'}`}>
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
