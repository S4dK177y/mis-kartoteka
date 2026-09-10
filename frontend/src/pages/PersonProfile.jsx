import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { DocumentCard, DocumentViewer } from '../components/ui';
import { confirmDialog } from '../utils/confirmDialog';

const getTypeLabel = (type) => {
  const map = { PRIMARY: 'Первичный', SECONDARY: 'Повторный', PREVENTIVE: 'Профилактический', VVK: 'ВВК' };
  return map[type] || type;
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
    if (await confirmDialog('Удалить этот документ?')) {
      try {
        await api.deleteDocument(docId);
        toast.success('Документ удален');
        await fetchPerson();
      } catch (error) {
        toast.error('Ошибка при удалении файла');
      }
    }
  };

  const combinedHistory = person ? [
    ...(person.hospitalizations || []).map(h => ({ ...h, entryType: 'hospitalization' })),
    ...(person.consultations || []).map(c => ({ ...c, entryType: c.type === 'VVK' ? 'vvk' : 'consultation' }))
  ].sort((a, b) => {
    const dateA = new Date(a.entryType === 'hospitalization' ? a.admissionDate : a.consultationDate);
    const dateB = new Date(b.entryType === 'hospitalization' ? b.admissionDate : b.consultationDate);
    return dateB - dateA;
  }) : [];

  const filteredHistory = combinedHistory.filter(item => {
    if (historyFilter === 'all') return true;
    return item.entryType === historyFilter;
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
              <button className={`btn btn-sm ${historyFilter === 'consultation' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setHistoryFilter('consultation')}>Амбулаторные приемы</button>
              <button className={`btn btn-sm ${historyFilter === 'vvk' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setHistoryFilter('vvk')}>ВВК</button>
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
                    const isHosp = item.entryType === 'hospitalization';
                    const isVvk = item.entryType === 'vvk';
                    const isConsult = item.entryType === 'consultation';
                    const date = isHosp ? item.admissionDate : item.consultationDate;
                    const path = isHosp ? `/patients/${item.id}` : `/consultations/${item.id}`;
                    
                    return (
                      <tr key={`${item.entryType}-${item.id}`} style={{ background: 'white', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} onClick={() => navigate(path)}>
                        <td className="p-4 font-medium" style={{ borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)' }}>
                          {new Date(date).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="p-4 text-sm text-muted">
                          {isHosp && <span className="flex items-center gap-1"><Activity size={14} className="text-primary"/> Госпитализация</span>}
                          {isConsult && <span className="flex items-center gap-1"><FileText size={14} className="text-secondary"/> {getTypeLabel(item.type)} прием</span>}
                          {isVvk && <span className="flex items-center gap-1" style={{ color: '#4338ca', fontWeight: 600 }}><FileText size={14} /> ВВК</span>}
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
                            <span className="badge" style={{ background: isVvk ? '#e0e7ff' : 'var(--bg-input)', border: `1px solid ${isVvk ? '#c7d2fe' : 'var(--border)'}`, color: isVvk ? '#4338ca' : 'inherit' }}>
                              {isVvk ? 'ВВК' : 'Амбулаторно'}
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
                <DocumentCard 
                  key={doc.id} 
                  doc={doc} 
                  onClick={handleFileClick} 
                  onDelete={handleDeleteDocument} 
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* File Viewer Modal */}
      <DocumentViewer 
        file={viewingFile} 
        isOpen={!!viewingFile} 
        onClose={() => setViewingFile(null)} 
      />
    </div>
  );
}
