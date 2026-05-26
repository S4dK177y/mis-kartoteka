import React from 'react';
import { Upload, FileText, Image, FileVideo, FileAudio, FileArchive, File as FileIcon, Download, Trash2 } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { api } from '../../api';

export const DocumentsManager = ({ patient, uploading, isDragging, onDragOver, onDragLeave, onDrop, onFileUpload, onDeleteDocument, onFileClick }) => {
  return (
    <Card className="flex-col" style={{ gridColumn: 'span 1', maxHeight: '600px' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="text-lg m-0 text-primary">Файлы</h3>
      </div>

      <div className="p-3 flex-col gap-2" style={{ flex: 1, overflowY: 'auto' }}>
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{
            border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-light)',
            background: isDragging ? 'var(--primary-light)' : 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem 1rem',
            textAlign: 'center',
            transition: 'all 0.2s',
            marginBottom: '0.5rem'
          }}
        >
          <input type="file" id="file-upload" style={{ display: 'none' }} onChange={onFileUpload} disabled={uploading}/>
          <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={24} style={{ color: isDragging ? 'var(--primary)' : 'var(--text-muted)' }} />
            <span className="text-sm text-muted">
              {uploading ? 'Загрузка...' : 'Перетащите файл сюда или нажмите для выбора'}
            </span>
          </label>
        </div>

        {patient.documents.length === 0 ? (
          <div className="text-center text-muted p-4">
            <FileText size={24} className="mx-auto mb-1 opacity-50" />
            <p className="text-xs">Нет загруженных файлов</p>
          </div>
        ) : (
          patient.documents.map(doc => (
            <div key={doc.id} className="flex justify-between items-center p-2" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div className="flex items-center gap-2" style={{ overflow: 'hidden' }}>
                {(() => {
                  const lowerName = doc.originalName.toLowerCase();
                  const lowerMime = doc.mimeType.toLowerCase();
                  if (lowerName.endsWith('.pdf')) return <FileText size={16} style={{ color: '#ef4444', flexShrink: 0 }} />;
                  if (lowerMime.startsWith('image/')) return <Image size={16} style={{ color: '#0ea5e9', flexShrink: 0 }} />;
                  if (lowerMime.startsWith('video/')) return <FileVideo size={16} style={{ color: '#a855f7', flexShrink: 0 }} />;
                  if (lowerMime.startsWith('audio/')) return <FileAudio size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />;
                  if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) return <FileArchive size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />;
                  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return <FileText size={16} style={{ color: '#2563eb', flexShrink: 0 }} />;
                  if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return <FileText size={16} style={{ color: '#10b981', flexShrink: 0 }} />;
                  return <FileIcon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />;
                })()}
                <div className="flex-col" style={{ overflow: 'hidden' }}>
                  <a href="#" onClick={(e) => onFileClick(e, doc)} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {doc.originalName}
                  </a>
                  <div className="text-muted text-xs mt-1">
                    {new Date(doc.createdAt).toLocaleDateString()} {doc.uploader?.username ? `• загрузил(а) ${doc.uploader.username}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <a href={api.getDocumentUrl(doc.id)} className="btn btn-icon" style={{ color: 'var(--primary)', background: 'transparent', padding: '0.2rem' }} title="Скачать" target="_blank" rel="noopener noreferrer">
                  <Download size={14} />
                </a>
                <Button variant="outline" style={{ color: 'var(--danger)', border: 'none', background: 'transparent', padding: '0.2rem' }} onClick={() => onDeleteDocument(doc.id)} title="Удалить">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))
        )}

        {patient.archiveDocuments && patient.archiveDocuments.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <FileArchive size={16} className="text-muted" />
              <h4 className="text-sm m-0 text-muted">Архивные файлы</h4>
            </div>
            {patient.archiveDocuments.map(doc => (
              <div key={doc.id} className="flex justify-between items-center p-2 mb-2 opacity-80" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div className="flex items-center gap-2" style={{ overflow: 'hidden' }}>
                  {(() => {
                    const lowerName = doc.originalName.toLowerCase();
                    const lowerMime = doc.mimeType.toLowerCase();
                    if (lowerName.endsWith('.pdf')) return <FileText size={16} style={{ color: '#ef4444', flexShrink: 0 }} />;
                    if (lowerMime.startsWith('image/')) return <Image size={16} style={{ color: '#0ea5e9', flexShrink: 0 }} />;
                    if (lowerMime.startsWith('video/')) return <FileVideo size={16} style={{ color: '#a855f7', flexShrink: 0 }} />;
                    if (lowerMime.startsWith('audio/')) return <FileAudio size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />;
                    if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) return <FileArchive size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />;
                    if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return <FileText size={16} style={{ color: '#2563eb', flexShrink: 0 }} />;
                    if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return <FileText size={16} style={{ color: '#10b981', flexShrink: 0 }} />;
                    return <FileIcon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />;
                  })()}
                  <div className="flex-col" style={{ overflow: 'hidden' }}>
                    <a href="#" onClick={(e) => onFileClick(e, doc)} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {doc.originalName}
                    </a>
                    <div className="text-muted text-xs mt-1">
                      {new Date(doc.createdAt).toLocaleDateString()}
                      {doc.consultationId && <span className="ml-1" title="Прикреплено к приему">(Прием)</span>}
                      {doc.patientId && <span className="ml-1" title="Прикреплено к госпитализации">(Госп.)</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <a href={api.getDocumentUrl(doc.id)} className="btn btn-icon" style={{ color: 'var(--primary)', background: 'transparent', padding: '0.2rem' }} title="Скачать" target="_blank" rel="noopener noreferrer">
                    <Download size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
