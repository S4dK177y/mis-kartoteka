import React from 'react';
import ICD10Autocomplete from '../../components/ICD10Autocomplete';

export const AnamnesisSection = ({ formData, handleChange }) => {
  return (
    <>
      <ICD10Autocomplete 
        label="Диагноз (МКБ-10)" 
        name="diagnosis" 
        value={formData.diagnosis} 
        onChange={handleChange} 
      />
      
      <div className="input-group mt-2 mb-0">
        <label className="input-label">Жалобы, анамнез, рекомендации (заметки)</label>
        <textarea 
          name="notes" 
          className="input-field" 
          style={{ minHeight: '120px', resize: 'vertical' }}
          value={formData.notes} 
          onChange={handleChange}
          placeholder="Введите описание приема и рекомендации..."
        ></textarea>
      </div>
    </>
  );
};
