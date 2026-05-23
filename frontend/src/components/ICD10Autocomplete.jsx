import React, { useState, useRef, useEffect } from 'react';
import { searchMKB10 } from '../mkb10';

export default function ICD10Autocomplete({ name, value, onChange, label, placeholder, required }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange({ target: { name, value: val } });
    
    if (val.length > 1) {
      setSuggestions(searchMKB10(val));
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    const val = `${item.code} - ${item.name}`;
    setQuery(val);
    onChange({ target: { name, value: val } });
    setIsOpen(false);
  };

  return (
    <div className="input-group" ref={wrapperRef} style={{ position: 'relative' }}>
      <label className="input-label">{label}</label>
      <input
        type="text"
        name={name}
        className="input-field"
        placeholder={placeholder || "Начните вводить код или название..."}
        value={query}
        onChange={handleInputChange}
        autoComplete="off"
        required={required}
      />
      {isOpen && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)',
          listStyle: 'none',
          padding: 0,
          margin: '4px 0 0 0',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {suggestions.map((item, index) => (
            <li 
              key={index} 
              onClick={() => handleSelect(item)}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid var(--border-light)' : 'none',
                fontSize: '0.85rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <strong>{item.code}</strong> <span className="text-muted">— {item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
