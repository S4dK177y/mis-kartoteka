import React from 'react';
import { FileText, FileArchive } from 'lucide-react';
import { Card, DocumentCard, DocumentUploader } from '../../components/ui';

export const DocumentsManager = ({ patient, uploading, isDragging, onDragOver, onDragLeave, onDrop, onFileUpload, onDeleteDocument, onFileClick }) => {
  return (
    <Card className="flex-col" style={{ gridColumn: 'span 1', maxHeight: '600px' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="text-lg m-0 text-primary">Файлы</h3>
      </div>

      <div className="p-3 flex-col gap-3" style={{ flex: 1, overflowY: 'auto' }}>
        <DocumentUploader
          isDragging={isDragging}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onFileUpload={onFileUpload}
          uploading={uploading}
        />

        {patient.documents.length === 0 ? (
          <div className="text-center text-muted p-4">
            <FileText size={24} className="mx-auto mb-1 opacity-50" />
            <p className="text-xs">Нет загруженных файлов</p>
          </div>
        ) : (
          <div className="flex-col gap-2">
            {patient.documents.map(doc => (
              <DocumentCard 
                key={doc.id} 
                doc={doc} 
                onClick={onFileClick} 
                onDelete={onDeleteDocument} 
              />
            ))}
          </div>
        )}

        {patient.archiveDocuments && patient.archiveDocuments.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <div className="flex items-center gap-2 mb-3">
              <FileArchive size={16} className="text-muted" />
              <h4 className="text-sm m-0 text-muted">Архивные файлы</h4>
            </div>
            <div className="flex-col gap-2 opacity-80">
              {patient.archiveDocuments.map(doc => (
                <DocumentCard 
                  key={doc.id} 
                  doc={doc} 
                  onClick={onFileClick} 
                  showUploader={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
