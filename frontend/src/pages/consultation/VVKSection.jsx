import React from 'react';
import { FileText, Upload, Download, Trash2 } from 'lucide-react';
import { api } from '../../api';
import { Card } from '../../components/ui';

export const VVKSection = ({
  vvkConclusion,
  handleVvkChange,
  isEditing,
  vvkDocument,
  uploadingVvk,
  handleVvkFileUpload,
  handleDeleteVvkDocument
}) => {
  return (
    <Card className="p-6 mb-4" style={{ borderTop: '4px solid #3b82f6', boxShadow: 'var(--shadow-md)' }}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl m-0 font-bold" style={{ color: '#1e293b' }}>ВВК</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-muted">Статус:</span>
          <select 
            name="status" 
            className="input-field" 
            style={{ width: 'auto', fontWeight: 600, color: vvkConclusion.status === 'COMPLETED' ? '#166534' : '#b45309', backgroundColor: vvkConclusion.status === 'COMPLETED' ? '#f0fdf4' : '#fffbeb', borderColor: vvkConclusion.status === 'COMPLETED' ? '#bbf7d0' : '#fde68a' }} 
            value={vvkConclusion.status} 
            onChange={handleVvkChange}
          >
            <option value="IN_PROGRESS">В процессе</option>
            <option value="COMPLETED">Завершено</option>
          </select>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
        {['neurologist', 'ophthalmologist', 'dentist', 'surgeon', 'therapist'].map(doctor => {
          const labelMap = { neurologist: 'Невролог', ophthalmologist: 'Офтальмолог', dentist: 'Стоматолог', surgeon: 'Хирург', therapist: 'Терапевт' };
          const name = `${doctor}Category`;
          const isCompleted = vvkConclusion.status === 'COMPLETED';
          return (
            <div key={doctor} className="p-3" style={{ backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <label className="block text-xs font-bold text-muted mb-2">{labelMap[doctor]} {isCompleted && '*'}</label>
              <select name={name} className="input-field" style={{ backgroundColor: 'white', padding: '6px', textAlign: 'center', fontSize: '0.85rem' }} value={vvkConclusion[name]} onChange={handleVvkChange} required={isCompleted}>
                <option value="">--</option>
                <option value="А">А</option><option value="А-1">А-1</option><option value="А-2">А-2</option><option value="А-3">А-3</option><option value="А-4">А-4</option>
                <option value="Б-1">Б-1</option><option value="Б-2">Б-2</option><option value="Б-3">Б-3</option><option value="Б-4">Б-4</option>
                <option value="В">В</option><option value="Г">Г</option><option value="Д">Д</option>
              </select>
            </div>
          );
        })}
      </div>
      
      <div className="p-6 mb-4" style={{ background: vvkConclusion.status === 'COMPLETED' ? '#f0fdf4' : '#f8fafc', border: `1px solid ${vvkConclusion.status === 'COMPLETED' ? '#bbf7d0' : 'var(--border)'}`, borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
          <h4 className="text-lg font-bold m-0" style={{ color: vvkConclusion.status === 'COMPLETED' ? '#166534' : 'inherit' }}>Итог ВВК {vvkConclusion.status === 'COMPLETED' && '*'}</h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: vvkConclusion.isMedicalLeave ? 'var(--primary)' : 'white', color: vvkConclusion.isMedicalLeave ? 'white' : 'var(--text-main)', border: '1px solid var(--border)', padding: '6px 16px', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}>
            <input type="checkbox" name="isMedicalLeave" checked={vvkConclusion.isMedicalLeave} onChange={handleVvkChange} style={{ cursor: 'pointer', margin: 0 }} />
            <span className="text-sm font-bold">Отпуск по болезни (Г)</span>
          </label>
        </div>
        
        {!vvkConclusion.isMedicalLeave ? (
          <div className="input-group mb-0" style={{ maxWidth: '300px' }}>
            <label className="input-label">Итоговая категория</label>
            <select name="finalCategory" className="input-field" value={vvkConclusion.finalCategory} onChange={handleVvkChange} required={vvkConclusion.status === 'COMPLETED' && !vvkConclusion.isMedicalLeave}>
              <option value="">Не выбрано (ожидает завершения)</option>
              <option value="А">А</option><option value="А-1">А-1</option><option value="А-2">А-2</option><option value="А-3">А-3</option><option value="А-4">А-4</option>
              <option value="Б-1">Б-1</option><option value="Б-2">Б-2</option><option value="Б-3">Б-3</option><option value="Б-4">Б-4</option>
              <option value="В">В</option><option value="Г">Г</option><option value="Д">Д</option>
            </select>
          </div>
        ) : (
          <div className="input-group mb-0" style={{ maxWidth: '300px' }}>
            <label className="input-label">Количество суток отпуска</label>
            <input type="number" name="medicalLeaveDays" className="input-field" value={vvkConclusion.medicalLeaveDays} onChange={handleVvkChange} min="1" max="365" required={vvkConclusion.status === 'COMPLETED' && vvkConclusion.isMedicalLeave} placeholder="Например: 15" />
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-md font-bold mb-3">Скан заключения ВВК</h4>
          {vvkDocument ? (
            <div className="flex justify-between items-center p-3" style={{ background: '#f0fdf4', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-secondary" />
                <div className="flex-col">
                  <span style={{ fontWeight: 600, color: '#166534' }}>{vvkDocument.originalName}</span>
                  <span className="text-xs text-muted">Загружен: {new Date(vvkDocument.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={api.getDocumentUrl(vvkDocument.id)} className="btn btn-icon btn-outline" target="_blank" rel="noopener noreferrer">
                  <Download size={16} />
                </a>
                <button type="button" className="btn btn-icon btn-danger" onClick={() => handleDeleteVvkDocument(vvkDocument.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input type="file" id="vvk-file-upload" style={{ display: 'none' }} onChange={handleVvkFileUpload} disabled={uploadingVvk}/>
              <label htmlFor="vvk-file-upload" className="btn btn-outline" style={{ display: 'inline-flex', cursor: 'pointer', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>
                <Upload size={16} /> {uploadingVvk ? 'Загрузка...' : 'Загрузить скан (PDF/Изображение)'}
              </label>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
