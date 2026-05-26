import React from 'react';

export const ObjectiveStatusSection = ({ formData, handleChange }) => {
  return (
    <div className="input-group mt-4 mb-0">
      <label className="input-label">Объективный статус</label>
      <textarea 
        name="objectiveStatus" 
        className="input-field" 
        style={{ minHeight: '120px', resize: 'vertical' }}
        value={formData.objectiveStatus || ''} 
        onChange={handleChange}
        placeholder="Введите данные объективного осмотра (ЧСС, АД, температура, локальный статус и т.д.)..."
      ></textarea>
    </div>
  );
};
