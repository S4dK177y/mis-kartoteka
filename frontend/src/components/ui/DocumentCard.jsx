import React from 'react';
import { Download, Trash2, Image, FileVideo, FileAudio, FileArchive, FileText, File as FileIcon } from 'lucide-react';
import { api } from '../../api';

export const DocumentCard = ({ doc, onClick, onDelete, isVvkScan = false, showUploader = true }) => {
  const getFileIcon = (fileName, mimeType) => {
    const lowerName = fileName.toLowerCase();
    const lowerMime = mimeType.toLowerCase();
    
    if (lowerName.endsWith('.pdf')) return <FileText size={24} style={{ color: '#ef4444' }} />;
    if (lowerMime.startsWith('image/')) return <Image size={24} style={{ color: '#0ea5e9' }} />;
    if (lowerMime.startsWith('video/')) return <FileVideo size={24} style={{ color: '#a855f7' }} />;
    if (lowerMime.startsWith('audio/')) return <FileAudio size={24} style={{ color: '#f59e0b' }} />;
    if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) return <FileArchive size={24} style={{ color: '#f59e0b' }} />;
    if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return <FileText size={24} style={{ color: '#2563eb' }} />;
    if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return <FileText size={24} style={{ color: '#10b981' }} />;
    
    return <FileIcon size={24} style={{ color: 'var(--text-muted)' }} />;
  };

  const isViewable = doc.mimeType.startsWith('image/') || doc.mimeType === 'application/pdf';

  const handleClick = (e) => {
    if (isViewable && onClick) {
      e.preventDefault();
      onClick(e, doc);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div 
      className="document-card"
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.75rem 1rem', 
        background: isVvkScan ? '#f0fdf4' : 'var(--bg-main)', 
        borderRadius: 'var(--radius-md)', 
        border: `1px solid ${isVvkScan ? '#bbf7d0' : 'var(--border-light)'}`,
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.2s ease',
        cursor: isViewable && onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (isViewable && onClick) e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = isVvkScan ? '#86efac' : 'var(--primary-light)';
      }}
      onMouseLeave={(e) => {
        if (isViewable && onClick) e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = isVvkScan ? '#bbf7d0' : 'var(--border-light)';
      }}
    >
      <div className="flex items-center gap-3 overflow-hidden" style={{ flex: 1 }}>
        <div 
          className="flex-shrink-0 flex items-center justify-center" 
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: 'var(--radius-sm)', 
            background: isVvkScan ? '#dcfce7' : 'var(--bg-input)'
          }}
        >
          {getFileIcon(doc.originalName, doc.mimeType)}
        </div>
        <div className="flex-col overflow-hidden">
          <span 
            className="font-semibold text-sm truncate block" 
            style={{ 
              color: isVvkScan ? '#166534' : 'var(--text-main)',
              textDecoration: isViewable && onClick ? 'none' : 'none'
            }}
            title={doc.originalName}
          >
            {doc.originalName}
            {isVvkScan && <span className="ml-2 text-xs opacity-75">(Скан ВВК)</span>}
          </span>
          <div className="text-muted text-xs mt-1 flex items-center gap-2 flex-wrap">
            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
            {doc.size && (
              <>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>{formatSize(doc.size)}</span>
              </>
            )}
            {showUploader && doc.uploader?.username && (
              <>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>{doc.uploader.username}</span>
              </>
            )}
            {doc.consultationId && (
              <>
                <span style={{ opacity: 0.5 }}>•</span>
                <span title="Прикреплено к приему">Прием</span>
              </>
            )}
            {doc.patientId && (
              <>
                <span style={{ opacity: 0.5 }}>•</span>
                <span title="Прикреплено к госпитализации">Госпитализация</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div 
        className="flex gap-1 flex-shrink-0 ml-3" 
        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking buttons
      >
        <a 
          href={api.getDocumentUrl(doc.id)} 
          className="btn btn-icon" 
          style={{ 
            color: 'var(--primary)', 
            background: 'transparent', 
            padding: '0.4rem',
            border: 'none'
          }} 
          title="Скачать"
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Download size={18} />
        </a>
        {onDelete && (
          <button 
            type="button"
            className="btn btn-icon" 
            style={{ 
              color: 'var(--danger)', 
              background: 'transparent', 
              padding: '0.4rem',
              border: 'none'
            }} 
            onClick={() => onDelete(doc.id)} 
            title="Удалить"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
