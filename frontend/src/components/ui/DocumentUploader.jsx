import React from 'react';
import { Upload, FilePlus } from 'lucide-react';

export const DocumentUploader = ({ 
  isDragging, 
  onDragOver, 
  onDragLeave, 
  onDrop, 
  onFileUpload, 
  uploading,
  label = 'Загрузить файлы',
  subtext = 'Перетащите файлы сюда или нажмите для выбора'
}) => {
  return (
    <div 
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-light)',
        background: isDragging ? 'var(--primary-light)' : 'var(--bg-main)',
        borderRadius: 'var(--radius-md)',
        padding: '2rem 1rem',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        cursor: uploading ? 'wait' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        boxShadow: isDragging ? 'inset 0 0 0 2px rgba(59, 130, 246, 0.1)' : 'none'
      }}
      onClick={() => {
        if (!uploading) document.getElementById('file-upload-input').click();
      }}
      onMouseEnter={(e) => {
        if (!isDragging && !uploading) {
          e.currentTarget.style.borderColor = 'var(--primary-light)';
          e.currentTarget.style.background = 'var(--bg-input)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging && !uploading) {
          e.currentTarget.style.borderColor = 'var(--border-light)';
          e.currentTarget.style.background = 'var(--bg-main)';
        }
      }}
    >
      <input 
        type="file" 
        id="file-upload-input" 
        style={{ display: 'none' }} 
        onChange={onFileUpload} 
        disabled={uploading}
      />
      <div 
        style={{ 
          background: isDragging ? 'var(--primary)' : 'var(--bg-input)',
          color: isDragging ? 'white' : 'var(--primary)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          marginBottom: '0.5rem'
        }}
      >
        {uploading ? <Upload size={28} className="animate-pulse" /> : <FilePlus size={28} />}
      </div>
      <div className="flex-col items-center">
        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          {uploading ? 'Загрузка файла...' : label}
        </span>
        <span className="text-sm text-muted">
          {uploading ? 'Пожалуйста, подождите' : subtext}
        </span>
      </div>
    </div>
  );
};
