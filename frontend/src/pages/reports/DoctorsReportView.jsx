import React, { useState, useEffect } from 'react';
import { Download, ChevronLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';

const monthsList = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export default function DoctorsReportView() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getDoctorsMonthlyReportData(month, year);
      setData(res.doctorStats);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки отчета');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month, year]);

  const handleDownload = () => {
    window.location.href = `${api.exportDoctorsReportUrl}?month=${month}&year=${year}`;
  };

  const renderTable = () => {
    if (!data) return null;
    
    const docs = Object.values(data);
    if (docs.length === 0) {
      return (
        <div className="empty-state">
          Нет данных за выбранный период
        </div>
      );
    }

    // Calculate totals
    const totals = { I: 0, II: 0, Z: 0, VVK: 0 };
    docs.forEach(doc => {
      for (let w = 0; w < 5; w++) {
        totals.I += doc.weeks[w].I || 0;
        totals.II += doc.weeks[w].II || 0;
        totals.Z += doc.weeks[w].Z || 0;
        totals.VVK += doc.weeks[w].VVK || 0;
      }
    });

    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
          <table className="table" style={{ width: 'max-content', minWidth: '100%', borderBottom: 'none' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)' }}>
            <tr>
              <th rowSpan="2" style={{ borderRight: '1px solid var(--border)', minWidth: '250px' }}>Врач</th>
              <th colSpan="4" style={{ textAlign: 'center', borderRight: '1px solid var(--border)' }}>Неделя 1</th>
              <th colSpan="4" style={{ textAlign: 'center', borderRight: '1px solid var(--border)' }}>Неделя 2</th>
              <th colSpan="4" style={{ textAlign: 'center', borderRight: '1px solid var(--border)' }}>Неделя 3</th>
              <th colSpan="4" style={{ textAlign: 'center', borderRight: '1px solid var(--border)' }}>Неделя 4</th>
              <th colSpan="4" style={{ textAlign: 'center', borderRight: '1px solid var(--border)' }}>Неделя 5</th>
              <th colSpan="4" style={{ textAlign: 'center', background: 'var(--bg-hover)' }}>Итог за месяц</th>
            </tr>
            <tr>
              {/* Недели 1-5 */}
              {[...Array(5)].map((_, i) => (
                <React.Fragment key={i}>
                  <th style={{ textAlign: 'center' }}>I</th>
                  <th style={{ textAlign: 'center' }}>II</th>
                  <th style={{ textAlign: 'center' }}>Z</th>
                  <th style={{ textAlign: 'center', borderRight: '1px solid var(--border)' }}>ВВК</th>
                </React.Fragment>
              ))}
              {/* Итог */}
              <th style={{ textAlign: 'center', background: 'var(--bg-hover)' }}>I</th>
              <th style={{ textAlign: 'center', background: 'var(--bg-hover)' }}>II</th>
              <th style={{ textAlign: 'center', background: 'var(--bg-hover)' }}>Z</th>
              <th style={{ textAlign: 'center', background: 'var(--bg-hover)' }}>ВВК</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc, idx) => {
              let sumI = 0, sumII = 0, sumZ = 0, sumVVK = 0;
              return (
                <tr key={idx}>
                  <td style={{ fontWeight: '500', borderRight: '1px solid var(--border)' }}>{doc.name}</td>
                  {[...Array(5)].map((_, w) => {
                    const I = doc.weeks[w].I || 0;
                    const II = doc.weeks[w].II || 0;
                    const Z = doc.weeks[w].Z || 0;
                    const VVK = doc.weeks[w].VVK || 0;
                    sumI += I; sumII += II; sumZ += Z; sumVVK += VVK;
                    
                    return (
                      <React.Fragment key={w}>
                        <td style={{ textAlign: 'center' }}>{I || '-'}</td>
                        <td style={{ textAlign: 'center' }}>{II || '-'}</td>
                        <td style={{ textAlign: 'center' }}>{Z || '-'}</td>
                        <td style={{ textAlign: 'center', borderRight: '1px solid var(--border)' }}>{VVK || '-'}</td>
                      </React.Fragment>
                    );
                  })}
                  <td style={{ textAlign: 'center', fontWeight: 'bold', background: 'var(--bg-hover)' }}>{sumI || '-'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', background: 'var(--bg-hover)' }}>{sumII || '-'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', background: 'var(--bg-hover)' }}>{sumZ || '-'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', background: 'var(--bg-hover)' }}>{sumVVK || '-'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10, background: 'var(--bg-card)', borderTop: '2px solid var(--border)', fontWeight: 'bold' }}>
            <tr>
              <td style={{ borderRight: '1px solid var(--border)' }}>ВСЕГО ЗА МЕСЯЦ:</td>
              <td colSpan="20" style={{ borderRight: '1px solid var(--border)' }}></td>
              <td style={{ textAlign: 'center', background: 'var(--bg-hover)' }}>{totals.I}</td>
              <td style={{ textAlign: 'center', background: 'var(--bg-hover)' }}>{totals.II}</td>
              <td style={{ textAlign: 'center', background: 'var(--bg-hover)' }}>{totals.Z}</td>
              <td style={{ textAlign: 'center', background: 'var(--bg-hover)' }}>{totals.VVK}</td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header mb-6">
        <div className="flex items-center gap-4">
          <button className="btn btn-icon btn-outline" onClick={() => navigate(-1)} title="Назад">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Сводный отчет по врачам</h1>
            <p className="page-subtitle">Статистика по количеству приемов за месяц</p>
          </div>
        </div>
      </div>

      <div className="page-content" style={{ padding: '0 1rem' }}>
        <div className="card mb-6" style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-3">
            <Calendar size={20} style={{ color: 'var(--primary)' }} />
            <div className="flex items-center" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <select 
                className="input-field" 
                style={{ border: 'none', background: 'transparent', padding: '0.5rem 1rem', width: 'auto', fontWeight: '500' }}
                value={month} 
                onChange={e => setMonth(Number(e.target.value))}
              >
                {monthsList.map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
              <div style={{ width: '1px', background: 'var(--border)', height: '24px' }}></div>
              <input 
                type="number" 
                className="input-field" 
                style={{ border: 'none', background: 'transparent', padding: '0.5rem 1rem', width: '100px', fontWeight: '500' }}
                value={year} 
                onChange={e => setYear(Number(e.target.value))} 
              />
            </div>
          </div>
          <button className="btn btn-primary flex items-center gap-2" onClick={handleDownload} disabled={loading || !data}>
            <Download size={18} /> 
            <span>Скачать Excel</span>
          </button>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}
        {loading ? (
          <div className="card flex justify-center items-center" style={{ height: '300px', color: 'var(--text-muted)' }}>
            Загрузка отчета...
          </div>
        ) : (
          renderTable()
        )}
      </div>
    </div>
  );
}
