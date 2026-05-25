import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Activity, FileText, Download, Trash2, Image, FileVideo, FileAudio, FileArchive, File as FileIcon, X } from 'lucide-react';
import { api } from '../api';
import { Document, Page, pdfjs } from 'react-pdf';
import { useInView } from 'react-intersection-observer';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const LazyPdfPage = ({ pageNumber, width }) => {
  const { ref, inView } = useInView({ rootMargin: '100px 0px', triggerOnce: false });
  return (
    <div ref={ref} style={{ minHeight: '800px', marginBottom: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
      {inView ? (
        <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} width={width} className="shadow-lg" renderMode="canvas" />
      ) : (
        <div style={{ height: '800px', width: width, background: '#444', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
          Загрузка страницы {pageNumber}...
        </div>
      )}
    </div>
  );
};

export default function PersonProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('all');
  
  const [viewingFile, setViewingFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    fetchPerson();
  }, [id]);

  async function fetchPerson() {
    try {
      setLoading(true);
      const data = await api.getPersonProfile(id);
      setPerson(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleFileClick = (e, doc) => {
    e.preventDefault();
    if (doc.mimeType.startsWith('image/') || doc.mimeType === 'application/pdf') {
      setViewingFile(doc);
      setPageNumber(1);
      setNumPages(null);
    } else {
      window.open(api.getDocumentUrl(doc.id), '_blank');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (window.confirm('Удалить этот документ?')) {
      try {
        await api.deleteDocument(docId);
        await fetchPerson();
      } catch (error) {
        alert('Ошибка при удалении файла');
      }
    }
  };

  const combinedHistory = person ? [
    ...(person.hospitalizations || []).map(h => ({ ...h, type: 'hospitalization' })),
    ...(person.consultations || []).map(c => ({ ...c, type: 'consultation' }))
  ].sort((a, b) => {
    const dateA = new Date(a.type === 'hospitalization' ? a.admissionDate : a.consultationDate);
    const dateB = new Date(b.type === 'hospitalization' ? b.admissionDate : b.consultationDate);
    return dateB - dateA;
  }) : [];

  const filteredHistory = combinedHistory.filter(item => {
    if (historyFilter === 'all') return true;
    return item.type === historyFilter;
  });

  if (loading) return <div className="p-8 text-center text-muted">Загрузка данных...</div>;
  if (!person) return <div className="p-8 text-center text-danger">Человек не найден</div>;

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <button className="btn btn-outline" style={{ alignSelf: 'flex-start', padding: '0.4rem 0.8rem' }} onClick={() => navigate('/persons')}>
        <ArrowLeft size={16} /> К списку всех пациентов
      </button>

      {/* Main Info Card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-primary m-0">{person.fullName}</h2>
                <div className="flex gap-2">
                  {person.militaryStatus === 'Контракт' && person.isSvoParticipant && (
                    <span className="badge" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>СВО</span>
                  )}
                  {person.militaryStatus === 'Контракт' && !person.isSvoParticipant && (
                    <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>Контракт</span>
                  )}
                  {person.militaryStatus === 'Призыв' && (
                    <span className="badge" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>Призыв</span>
                  )}
                </div>
              </div>
              <div className="text-muted flex items-center gap-2 text-sm">
                {person.birthDate && (
                  <span style={{ fontWeight: 500 }}>{new Date(person.birthDate).toLocaleDateString('ru-RU')}</span>
                )}
                {(person.rank || person.militaryUnit || person.tokenNumber) && <span>•</span>}
                {person.rank && <span>{person.rank}</span>}
                {person.militaryUnit && <span>в/ч {person.militaryUnit}</span>}
                {person.tokenNumber && <span>Жетон: {person.tokenNumber}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid-3 gap-4">
          <div className="flex-col gap-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">Контакты пациента</div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Телефон:</span>
              <span className="font-medium">{person.phoneNumber || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Адрес:</span>
              <span className="font-medium text-right" style={{ maxWidth: '200px' }}>{person.address || '—'}</span>
            </div>
          </div>
          
          <div className="flex-col gap-2" style={{ gridColumn: 'span 2' }}>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">Контакты близкого человека</div>
            {person.relativeRelation || person.relativeFullName || person.relativePhone ? (
              <div className="grid-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Кем приходится:</span>
                  <span className="font-medium">{person.relativeRelation || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">ФИО:</span>
                  <span className="font-medium text-right">{person.relativeFullName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Телефон:</span>
                  <span className="font-medium">{person.relativePhone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Адрес:</span>
                  <span className="font-medium text-right">{person.relativeAddress || '—'}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted">Нет данных о близких</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-layout-admin" style={{ gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>
        
        {/* Unified History */}
        <div className="card flex-col">
          <div className="p-4 border-b flex items-center justify-between" style={{ background: '#f8fafc' }}>
            <h3 className="text-lg font-bold m-0 text-primary flex items-center gap-2"><Activity size={18} /> Общая история обращений</h3>
            <div className="flex gap-2">
              <button className={`btn btn-sm ${historyFilter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setHistoryFilter('all')}>Все</button>
              <button className={`btn btn-sm ${historyFilter === 'hospitalization' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setHistoryFilter('hospitalization')}>Госпитализации</button>
              <button className={`btn btn-sm ${historyFilter === 'consultation' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setHistoryFilter('consultation')}>Приемы</button>
            </div>
          </div>
          <div className="p-4">
            <div className="table-wrapper">
              <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                <thead>
                  <tr>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Дата</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Тип обращения</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Подробности (Диагноз / Отделение)</th>
                    <th style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(item => {
                    const isHosp = item.type === 'hospitalization';
                    const date = isHosp ? item.admissionDate : item.consultationDate;
                    const path = isHosp ? `/patients/${item.id}` : `/consultations/${item.id}/edit`;
                    
                    return (
                      <tr key={`${item.type}-${item.id}`} style={{ background: 'white', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} onClick={() => navigate(path)}>
                        <td className="p-4 font-medium" style={{ borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)' }}>
                          {new Date(date).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="p-4 text-sm text-muted">
                          {isHosp ? (
                            <span className="flex items-center gap-1"><Activity size={14} className="text-primary"/> Госпитализация</span>
                          ) : (
                            <span className="flex items-center gap-1"><FileText size={14} className="text-secondary"/> Прием</span>
                          )}
                        </td>
                        <td className="p-4 text-sm">
                          {isHosp ? (
                            <div>
                              <div className="font-bold">{item.department}</div>
                              {item.caseHistoryNumber && <div className="text-muted text-xs">№ ИБ: {item.caseHistoryNumber}</div>}
                            </div>
                          ) : (
                            <div>
                              <div className="font-bold">{item.diagnosis || 'Без диагноза'}</div>
                              {item.notes && <div className="text-muted text-xs line-clamp-1">{item.notes}</div>}
                            </div>
                          )}
                        </td>
                        <td className="p-4" style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                          {isHosp ? (
                            <span className={`badge ${item.status === 'На лечении' ? 'badge-active' : 'badge-archived'}`}>
                              {item.status}
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                              Амбулаторно
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredHistory.length === 0 && (
                    <tr><td colSpan="4" className="text-center p-8 text-muted">Нет записей</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Unified Documents */}
        <div className="card flex-col" style={{ maxHeight: '600px' }}>
          <div className="p-4 border-b flex items-center gap-2" style={{ background: '#f8fafc' }}>
            <FileText size={18} className="text-primary" />
            <h3 className="text-lg font-bold m-0 text-primary">Все файлы</h3>
          </div>
          <div className="p-3 flex-col gap-2" style={{ flex: 1, overflowY: 'auto' }}>
            {!person.documents || person.documents.length === 0 ? (
              <div className="text-center text-muted p-4">
                <FileText size={24} className="mx-auto mb-1 opacity-50" />
                <p className="text-xs">Нет загруженных файлов</p>
              </div>
            ) : (
              person.documents.map(doc => (
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
                      <a href="#" onClick={(e) => handleFileClick(e, doc)} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={doc.originalName}>
                        {doc.originalName}
                      </a>
                      <div className="text-muted text-xs mt-1">
                        {new Date(doc.createdAt).toLocaleDateString()}
                        {doc.consultationId && <span className="ml-1" title="Прикреплено к приему">(Прием)</span>}
                        {doc.patientId && <span className="ml-1" title="Прикреплено к госпитализации">(Госпитализация)</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <a href={api.getDocumentUrl(doc.id)} className="btn btn-icon" style={{ color: 'var(--primary)', background: 'transparent', padding: '0.2rem' }} title="Скачать">
                      <Download size={14} />
                    </a>
                    <button className="btn btn-icon" style={{ color: 'var(--danger)', background: 'transparent', padding: '0.2rem' }} onClick={() => handleDeleteDocument(doc.id)} title="Удалить">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* File Viewer Modal */}
      {viewingFile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FileIcon size={20} />
              <span style={{ fontWeight: 600 }}>{viewingFile.originalName}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <a href={api.getDocumentUrl(viewingFile.id)} className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} title="Скачать">
                <Download size={16} /> Скачать
              </a>
              <button className="btn btn-icon" style={{ color: 'white', background: 'rgba(255,255,255,0.1)' }} onClick={() => setViewingFile(null)}>
                <X size={20} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '1rem', overflow: 'auto' }}>
            {viewingFile.mimeType.startsWith('image/') ? (
              <img src={`${api.getDocumentUrl(viewingFile.id)}?inline=true`} alt={viewingFile.originalName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', alignSelf: 'center' }} />
            ) : (
              <div style={{ background: '#333', padding: '1rem', borderRadius: '8px', minWidth: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Document
                  file={{ url: `${api.getDocumentUrl(viewingFile.id)}?inline=true`, withCredentials: true }}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={<div className="text-white p-8">Загрузка PDF...</div>}
                >
                  {Array.from(new Array(numPages || 0), (el, index) => (
                    <LazyPdfPage 
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      width={Math.min(window.innerWidth * 0.9, 900)}
                    />
                  ))}
                </Document>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
