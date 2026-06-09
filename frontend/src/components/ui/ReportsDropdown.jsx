import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ReportsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

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
          <button 
            onClick={() => { navigate('/reports/patients'); setIsOpen(false); }}
            className="dropdown-item hover-bg"
            style={{ padding: '0.75rem 1rem', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Отчет по всем пациентам
          </button>
          <button 
            onClick={() => { navigate('/reports/doctors'); setIsOpen(false); }}
            className="dropdown-item hover-bg"
            style={{ padding: '0.75rem 1rem', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Сводный отчет по врачам
          </button>
          </div>
        </div>
      )}
    </div>
  );
};
