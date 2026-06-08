import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { api } from '../../api';
import { Modal } from './Modal';

export const ReportsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const handleDownloadDoctors = () => {
    window.location.href = `${api.exportDoctorsReportUrl}?month=${month}&year=${year}`;
    setShowModal(false);
  };

  return (
    <div style={{ position: 'relative' }} onMouseLeave={() => setIsOpen(false)}>
      <button 
        className="btn btn-outline" 
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
      >
        <Download size={18} /> <span className="hide-on-mobile">Отчеты</span> <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, paddingTop: '0.5rem',
          zIndex: 100, display: 'flex', flexDirection: 'column', minWidth: '220px'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', 
            borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column',
            boxShadow: 'var(--shadow-md)', overflow: 'hidden'
          }}>
          <a 
            href={api.exportPatientsUrl} 
            download 
            className="dropdown-item hover-bg"
            style={{ padding: '0.75rem 1rem', textDecoration: 'none', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}
          >
            Экспорт всех пациентов
          </a>
          <button 
            onClick={() => { setShowModal(true); setIsOpen(false); }}
            className="dropdown-item hover-bg"
            style={{ padding: '0.75rem 1rem', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Сводный отчет по врачам
          </button>
          </div>
        </div>
      )}

      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Сводный отчет по врачам">
          <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
            <div className="flex-1 input-group" style={{ minWidth: '150px' }}>
              <label className="input-label">Месяц</label>
              <select className="input-field" value={month} onChange={e => setMonth(Number(e.target.value))}>
                {['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'].map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 input-group" style={{ minWidth: '150px' }}>
              <label className="input-label">Год</label>
              <input type="number" className="input-field" value={year} onChange={e => setYear(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Отмена</button>
            <button className="btn btn-primary flex items-center gap-2" onClick={handleDownloadDoctors}>
              <Download size={16} /> Скачать Excel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
