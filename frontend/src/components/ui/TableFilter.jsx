import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Filter, Search } from 'lucide-react';

export default function TableFilter({ 
  colKey, 
  filters, 
  getUniqueValues, 
  onFilterToggle, 
  onSelectAll, 
  onClearAll 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  
  const iconRef = useRef(null);
  const dropdownRef = useRef(null);

  const isFiltered = filters[colKey] && filters[colKey].size > 0;

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setCoords({
        // We add some pixel offset to render below the icon.
        // We also check if it would go off the right edge of the screen.
        top: rect.bottom + window.scrollY + 5,
        left: Math.min(rect.left + window.scrollX, window.innerWidth - 300 - 20) // 300px max width + 20px padding
      });
      setFilterSearch('');
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close if clicked outside both the dropdown and the toggle icon
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && 
          iconRef.current && !iconRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    // Using a boolean flag to prevent the initial scroll event from closing immediately on open
    let isInitialOpen = true;
    const handleScroll = (e) => {
      // Do not close if the scroll event originated from inside the dropdown container
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
        return;
      }
      if (!isInitialOpen) {
        setIsOpen(false);
      }
      isInitialOpen = false;
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Listen to scroll events on document capturing phase to catch scroll on any child elements like table-responsive
      window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isOpen]);

  const renderDropdown = () => {
    if (!isOpen) return null;

    const uniqueVals = getUniqueValues(colKey);
    const visibleVals = uniqueVals.filter(v => v.toLowerCase().includes(filterSearch.toLowerCase()));
    const currentFilterSet = filters[colKey] || new Set();

    return createPortal(
      <div 
        ref={dropdownRef} 
        style={{
          position: 'absolute', 
          top: `${coords.top}px`, 
          left: `${Math.max(0, coords.left)}px`,
          background: 'var(--bg-main)', // Solid background, NOT var(--bg-card) which might be translucent
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', 
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999, 
          minWidth: '220px', 
          maxWidth: '300px', 
          display: 'flex', 
          flexDirection: 'column'
        }} 
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()} // Prevent closing when scrolling inside dropdown
      >
        <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-main)', borderRadius: 'var(--radius) var(--radius) 0 0' }}>
          <div className="input-group" style={{ margin: 0, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              style={{ padding: '0.25rem 0.5rem 0.25rem 28px', fontSize: '0.85rem' }}
              placeholder="Поиск..."
              autoFocus
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', background: 'var(--bg-main)', borderRadius: '0 0 var(--radius) var(--radius)' }}>
          <div className="flex gap-2 mb-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <button className="btn btn-outline" style={{ flex: 1, padding: '0.2rem', fontSize: '0.8rem' }} onClick={() => onSelectAll(colKey, visibleVals)}>Выбрать все</button>
            <button className="btn btn-outline" style={{ flex: 1, padding: '0.2rem', fontSize: '0.8rem' }} onClick={() => onClearAll(colKey)}>Сбросить</button>
          </div>
          
          {visibleVals.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>Нет совпадений</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {visibleVals.map(val => (
                <label key={val} className="flex items-start gap-2 hover-bg" style={{ padding: '0.25rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input 
                    type="checkbox" 
                    checked={currentFilterSet.has(val)}
                    onChange={() => onFilterToggle(colKey, val)}
                    style={{ marginTop: '3px' }}
                  />
                  <span style={{ wordBreak: 'break-word', whiteSpace: 'normal', flex: 1 }}>{val || '(Пусто)'}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div 
      ref={iconRef}
      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem', borderRadius: '4px', background: isOpen ? 'var(--bg-hover)' : 'transparent' }}
      onClick={toggleDropdown}
      title="Фильтр"
    >
      <Filter size={14} style={{ color: isFiltered ? 'var(--primary)' : 'var(--text-muted)' }} />
      {renderDropdown()}
    </div>
  );
}
