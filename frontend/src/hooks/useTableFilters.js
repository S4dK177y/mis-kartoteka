import { useState, useMemo, useCallback } from 'react';

export function useTableFilters(data, columnsConfig = []) {
  const [filters, setFilters] = useState({});

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(row => {
      return Object.entries(filters).every(([key, selectedSet]) => {
        if (!selectedSet || selectedSet.size === 0) return true;
        
        const colDef = columnsConfig.find(c => c.key === key);
        const val = colDef && colDef.getValue ? colDef.getValue(row) : row[key];
        
        return selectedSet.has(String(val || ''));
      });
    });
  }, [data, filters, columnsConfig]);

  const getUniqueValues = useCallback((colKey) => {
    if (!data) return [];
    const colDef = columnsConfig.find(c => c.key === colKey);
    const vals = new Set(data.map(row => {
      const val = colDef && colDef.getValue ? colDef.getValue(row) : row[colKey];
      return String(val || '');
    }));
    return Array.from(vals).sort();
  }, [data, columnsConfig]);

  const handleFilterToggle = (colKey, val) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      const set = new Set(newFilters[colKey] || []);
      if (set.has(val)) {
        set.delete(val);
      } else {
        set.add(val);
      }
      if (set.size === 0) {
        delete newFilters[colKey];
      } else {
        newFilters[colKey] = set;
      }
      return newFilters;
    });
  };

  const handleSelectAll = (colKey, valsToSelect) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      newFilters[colKey] = new Set(valsToSelect);
      return newFilters;
    });
  };

  const handleClearAll = (colKey) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[colKey];
      return newFilters;
    });
  };

  const resetAllFilters = () => setFilters({});

  return {
    filters,
    filteredData,
    getUniqueValues,
    handleFilterToggle,
    handleSelectAll,
    handleClearAll,
    resetAllFilters
  };
}
