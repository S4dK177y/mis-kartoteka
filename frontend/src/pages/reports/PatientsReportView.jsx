import React, { useState, useEffect } from 'react';
import { Download, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useTableFilters } from '../../hooks/useTableFilters';
import TableFilter from '../../components/ui/TableFilter';

const columns = [
  { key: 'recordType', label: 'Тип записи' },
  { key: 'caseHistoryNumber', label: '№ ИБ' },
  { key: 'date', label: 'Дата приема/поступления' },
  { key: 'time', label: 'Время' },
  { key: 'militaryStatus', label: 'Статус службы' },
  { key: 'isSvoParticipant', label: 'Участник СВО' },
  { key: 'rank', label: 'Звание' },
  { key: 'fullName', label: 'ФИО' },
  { key: 'birthDate', label: 'Дата рождения' },
  { key: 'tokenNumber', label: 'Жетон' },
  { key: 'militaryUnit', label: '№ в/ч' },
  { key: 'phoneNumber', label: 'Телефон' },
  { key: 'relativeRelation', label: 'Статус близкого' },
  { key: 'relativeFullName', label: 'ФИО близкого' },
  { key: 'relativePhone', label: 'Телефон близкого' },
  { key: 'relativeAddress', label: 'Адрес близкого' },
  { key: 'allDiagnoses', label: 'Диагнозы (все)', minWidth: '200px' },
  { key: 'department', label: 'Отделение' },
  { key: 'status', label: 'Статус' },
  { key: 'endDate', label: 'Дата выписки/След. визит' },
  { key: 'endTime', label: 'Время (выписка/след.)' },
  { key: 'notes', label: 'Куда выписан/Заметки', minWidth: '150px' }
];

export default function PatientsReportView() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const {
    filters,
    filteredData,
    getUniqueValues,
    handleFilterToggle,
    handleSelectAll,
    handleClearAll,
    resetAllFilters
  } = useTableFilters(data, columns);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAllPatientsReportData();
      setData(res.rows);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки отчета');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownload = () => {
    window.location.href = api.exportPatientsUrl;
  };

  const renderTable = () => {
    if (!data) return null;
    
    if (data.length === 0) {
      return (
        <div className="empty-state">
          Нет записей для отображения
        </div>
      );
    }

    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
          <table className="table" style={{ width: 'max-content', minWidth: '100%', borderBottom: 'none' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <tr>
              {columns.map(col => {
                const isFiltered = filters[col.key] && filters[col.key].size > 0;
                return (
                  <th key={col.key} style={{ minWidth: col.minWidth || 'auto', borderRight: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <span style={{ fontWeight: isFiltered ? 'bold' : 'normal', color: isFiltered ? 'var(--primary)' : 'inherit' }}>{col.label}</span>
                      <TableFilter 
                        colKey={col.key}
                        filters={filters}
                        getUniqueValues={getUniqueValues}
                        onFilterToggle={handleFilterToggle}
                        onSelectAll={handleSelectAll}
                        onClearAll={handleClearAll}
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? filteredData.map((row, idx) => (
              <tr key={idx}>
                {columns.map(col => {
                  let cellStyle = { borderRight: '1px solid var(--border)' };
                  if (col.key === 'fullName') cellStyle.fontWeight = '500';
                  if (col.key === 'allDiagnoses' || col.key === 'notes') {
                    cellStyle.whiteSpace = 'pre-wrap';
                    cellStyle.fontSize = '0.9rem';
                  }
                  
                  return (
                    <td key={col.key} style={cellStyle}>
                      {row[col.key]}
                    </td>
                  );
                })}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  По заданным фильтрам ничего не найдено
                </td>
              </tr>
            )}
          </tbody>
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
            <h1 className="page-title">Отчет по всем пациентам</h1>
            <p className="page-subtitle">Сводный отчет по всем записям</p>
          </div>
        </div>
      </div>

      <div className="page-content" style={{ padding: '0 1rem' }}>
        <div className="card mb-6" style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '500' }}>Все записи</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
              Полная база пациентов, амбулаторных приемов и истории госпитализаций.
              {Object.keys(filters).length > 0 && (
                <span style={{ color: 'var(--primary)', marginLeft: '0.5rem', fontWeight: '500' }}>
                  Применены фильтры ({Object.keys(filters).length} столбцов)
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '0.1rem 0.5rem', marginLeft: '0.5rem', fontSize: '0.8rem', height: 'auto' }}
                    onClick={resetAllFilters}
                  >
                    Сбросить все
                  </button>
                </span>
              )}
            </p>
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
