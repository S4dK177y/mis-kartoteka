import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, Trash2, Upload, ExternalLink, RefreshCw, LogOut, 
  AlertCircle, FilePlus, X, User, Calendar, MapPin, Activity, 
  FileText, Download, Shield, Plus, Save, Edit3, Image, 
  FileArchive, File as FileIcon, FileAudio, FileVideo 
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ru } from 'date-fns/locale';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Document, Page, pdfjs } from 'react-pdf';
import { useInView } from 'react-intersection-observer';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
import { DEPARTMENTS } from './PatientForm';
import ICD10Autocomplete from '../components/ICD10Autocomplete';

const LazyPdfPage = ({ pageNumber, width }) => {
  const { ref, inView } = useInView({
    rootMargin: '100px 0px', // Tight margin to unmount quickly
    triggerOnce: false,
  });

  return (
    <div ref={ref} style={{ minHeight: '800px', marginBottom: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
      {inView ? (
        <Page 
          pageNumber={pageNumber} 
          renderTextLayer={false} 
          renderAnnotationLayer={false} 
          width={width}
          className="shadow-lg"
          renderMode="canvas"
        />
      ) : (
        <div style={{ height: '800px', width: width, background: '#444', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
          Загрузка страницы {pageNumber}...
        </div>
      )}
    </div>
  );
};

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [showTransfer, setShowTransfer] = useState(false);
  const [showDischarge, setShowDischarge] = useState(false);
  
  const [transferData, setTransferData] = useState({
    department: DEPARTMENTS[0],
    date: new Date()
  });
  
  const [dischargeData, setDischargeData] = useState({
    date: new Date(),
    destination: '',
    finalDiagnosis: ''
  });
  
  const [viewingFile, setViewingFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      const data = await api.getPatient(id);
      setPatient(data);
      setDischargeData(prev => ({
        ...prev,
        finalDiagnosis: data.finalDiagnosis || data.clinicalDiagnosis || data.admissionDiagnosis || ''
      }));
    } catch (error) {
      console.error(error);
      alert('Ошибка при загрузке данных пациента');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить эту карту пациента? Это действие необратимо.')) {
      try {
        await api.deletePatient(id);
        navigate('/');
      } catch (error) {
        alert('Ошибка при удалении пациента');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadDocument(id, file);
      await fetchPatient();
    } catch (error) {
      alert('Ошибка при загрузке файла');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = null; 
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploading(true);
      try {
        await api.uploadDocument(id, file);
        await fetchPatient();
      } catch (error) {
        alert('Ошибка при загрузке файла');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (window.confirm('Удалить этот документ?')) {
      try {
        await api.deleteDocument(docId);
        await fetchPatient();
      } catch (error) {
        alert('Ошибка при удалении файла');
      }
    }
  };

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

  const handleTransfer = async () => {
    try {
      await api.transferPatient(id, transferData.department, transferData.date.toISOString());
      setShowTransfer(false);
      await fetchPatient();
    } catch (error) {
      alert('Ошибка при переводе');
    }
  };

  const handleDischarge = async () => {
    try {
      await api.updatePatient(id, {
        status: 'Выписан',
        dischargeDate: dischargeData.date.toISOString(),
        dischargeDestination: dischargeData.destination,
        finalDiagnosis: dischargeData.finalDiagnosis
      });
      setShowDischarge(false);
      await fetchPatient();
    } catch (error) {
      alert('Ошибка при выписке');
    }
  };

  const handleReadmission = () => {
    navigate('/patients/new', { 
      state: { 
        readmissionData: {
          personId: patient.personId,
          fullName: patient.fullName,
          birthDate: patient.birthDate,
          tokenNumber: patient.tokenNumber,
          rank: patient.rank,
          militaryUnit: patient.militaryUnit,
          militaryStatus: patient.militaryStatus,
          isSvoParticipant: patient.isSvoParticipant,
          address: patient.address
        }
      }
    });
  };

  if (loading || !patient) return <div className="p-6 text-center text-muted">Загрузка...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="flex-col gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button className="btn btn-icon btn-outline" onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl m-0 flex items-center gap-2">
                {patient.fullName}
                {patient.militaryStatus === 'Контракт' && patient.isSvoParticipant && (
                  <span className="badge badge-active" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>СВО</span>
                )}
              </h2>
            </div>
            <div className="text-muted text-sm flex gap-3 mt-1 flex-wrap">
              {patient.caseHistoryNumber && <span>ИБ: {patient.caseHistoryNumber}</span>}
              {patient.tokenNumber && <span>Ж: {patient.tokenNumber}</span>}
              {patient.rank && <span>Зв: {patient.rank}</span>}
              {patient.militaryStatus && <span>Статус: {patient.militaryStatus}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {patient.status === 'На лечении' ? (
            <>
              <button className="btn btn-outline" style={{ color: 'var(--primary-hover)', borderColor: 'var(--primary-light)' }} onClick={() => { setShowTransfer(!showTransfer); setShowDischarge(false); }}>
                <RefreshCw size={14} /> Перевод в другое отд.
              </button>
              <button className="btn btn-outline" style={{ color: 'var(--secondary-hover)', borderColor: 'var(--secondary-light)' }} onClick={() => { setShowDischarge(!showDischarge); setShowTransfer(false); }}>
                <LogOut size={14} /> Выписка / Перевод
              </button>
            </>
          ) : (
            <button className="btn btn-outline" style={{ color: 'var(--primary-hover)', borderColor: 'var(--primary-light)' }} onClick={handleReadmission}>
              <FilePlus size={14} /> Повторная госпитализация
            </button>
          )}
          <button className="btn btn-outline" onClick={() => navigate(`/patients/${id}/edit`)}>
            <Edit2 size={14} /> Изменить
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={14} /> Удалить
          </button>
        </div>
      </div>

      {showTransfer && (
        <div className="card p-4 mb-4 animate-fade-in" style={{ border: '2px solid var(--primary-light)' }}>
          <h3 className="text-lg mb-3">Оформление перевода</h3>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Отделение перевода</label>
              <select className="input-field" value={transferData.department} onChange={e => setTransferData({...transferData, department: e.target.value})}>
                {DEPARTMENTS.map(dep => <option key={dep} value={dep} disabled={dep === patient.department}>{dep}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Дата и время перевода</label>
              <DatePicker
                selected={transferData.date}
                onChange={(date) => setTransferData({...transferData, date})}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={5}
                dateFormat="dd.MM.yyyy HH:mm"
                locale={ru}
                className="input-field"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button className="btn btn-outline" onClick={() => setShowTransfer(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={handleTransfer}>Сохранить</button>
          </div>
        </div>
      )}

      {showDischarge && (
        <div className="card p-4 mb-4 animate-fade-in" style={{ border: '2px solid var(--secondary-light)', overflow: 'visible', zIndex: 10, position: 'relative' }}>
          <h3 className="text-lg mb-3">Оформление выписки / перевода</h3>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Дата и время выписки</label>
              <DatePicker
                selected={dischargeData.date}
                onChange={(date) => setDischargeData({...dischargeData, date})}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={5}
                dateFormat="dd.MM.yyyy HH:mm"
                locale={ru}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Куда направлен</label>
              <input type="text" className="input-field" placeholder="Например: домой с улучшением" value={dischargeData.destination} onChange={e => setDischargeData({...dischargeData, destination: e.target.value})} />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <ICD10Autocomplete 
              label="Заключительный диагноз (МКБ-10)" 
              name="finalDiagnosis" 
              value={dischargeData.finalDiagnosis} 
              onChange={(e) => setDischargeData({...dischargeData, finalDiagnosis: e.target.value})} 
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button className="btn btn-outline" onClick={() => setShowDischarge(false)}>Отмена</button>
            <button className="btn btn-secondary" onClick={handleDischarge}>Сохранить</button>
          </div>
        </div>
      )}

      <div className="grid-3">
        
        {/* Left Column: Details */}
        <div className="flex-col gap-4" style={{ gridColumn: 'span 1' }}>
          <div className="card p-4">
            <h3 className="text-lg mb-3 text-primary">Данные</h3>
            
            <div className="flex-col gap-2 text-sm">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted">Дата рождения:</span>
                <span style={{ fontWeight: 500 }}>{new Date(patient.birthDate).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted">№ в/ч:</span>
                <span style={{ fontWeight: 500 }}>{patient.militaryUnit || '—'}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted">Телефон:</span>
                <span style={{ fontWeight: 500 }}>{patient.phoneNumber || '—'}</span>
              </div>
              {patient.relativeRelation || patient.relativeFullName || patient.relativePhone ? (
                <div className="flex-col gap-1 border-b pb-1">
                  <span className="text-muted text-xs uppercase font-bold">Близкий человек:</span>
                  <div className="flex justify-between">
                    <span className="text-muted text-xs">Статус:</span>
                    <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{patient.relativeRelation || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted text-xs">ФИО:</span>
                    <span style={{ fontWeight: 500, fontSize: '0.85rem', textAlign: 'right' }}>{patient.relativeFullName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted text-xs">Телефон:</span>
                    <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{patient.relativePhone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted text-xs">Адрес:</span>
                    <span style={{ fontWeight: 500, fontSize: '0.85rem', textAlign: 'right' }}>{patient.relativeAddress || '—'}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted">Близкие:</span>
                  <span style={{ fontWeight: 500, textAlign: 'right' }}>—</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted">Отделение:</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-hover)' }}>{patient.department}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted">Статус:</span>
                <div className="flex items-center gap-1">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: patient.status === 'На лечении' ? 'var(--primary)' : 'var(--text-muted)' }}></div>
                  <span style={{ fontWeight: 600, color: patient.status === 'На лечении' ? 'var(--primary-hover)' : 'var(--text-muted)' }}>
                    {patient.status}
                  </span>
                </div>
              </div>
              <div className="flex-col pb-1 border-b">
                <span className="text-muted mb-1">Поступил:</span>
                <span style={{ fontWeight: 500 }}>
                  {new Date(patient.admissionDate).toLocaleDateString('ru-RU')} в {new Date(patient.admissionDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              
              {patient.status === 'Выписан' && (
                <div className="flex-col pb-1 border-b" style={{ background: 'var(--secondary-light)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <span className="text-muted mb-1">Выписан:</span>
                  <span style={{ fontWeight: 600, color: 'var(--secondary-hover)' }}>
                    {patient.dischargeDate ? `${new Date(patient.dischargeDate).toLocaleDateString('ru-RU')} в ${new Date(patient.dischargeDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}` : '—'}
                  </span>
                  <span className="mt-1 text-xs">{patient.dischargeDestination || 'Исход не указан'}</span>
                </div>
              )}

              <div className="flex-col mt-1">
                <span className="text-muted text-xs mb-1">Адрес:</span>
                <p>{patient.address || 'Не указан'}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <h3 className="text-lg mb-3 text-primary">История отделений</h3>
            <div className="timeline mt-2">
              {patient.transfers && patient.transfers.length > 0 ? (
                [...patient.transfers].reverse().map((t, idx) => (
                  <div key={t.id} className="timeline-item" style={{ marginBottom: '1rem' }}>
                    <div className="text-sm font-semibold">{t.toDepartment}</div>
                    <div className="text-xs text-muted">
                      {new Date(t.transferDate).toLocaleDateString('ru-RU')} в {new Date(t.transferDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    {idx === 0 && <div className="text-xs text-muted">(Первичное)</div>}
                  </div>
                ))
              ) : (
                <p className="text-muted text-xs text-center">Нет истории</p>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Diagnoses */}
        <div className="card p-4" style={{ gridColumn: 'span 1' }}>
          <h3 className="text-lg mb-3 text-primary">Диагнозы</h3>
          
          <div className="flex-col gap-4">
            <div className="p-4" style={{ background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">При поступлении</div>
              <p className="text-sm m-0 leading-relaxed text-slate-800">{patient.admissionDiagnosis || 'Не установлен'}</p>
            </div>
            
            <div className="p-4 shadow-sm" style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
              <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Клинический</div>
              <p className="text-sm m-0 leading-relaxed text-slate-900" style={{ fontWeight: 500 }}>{patient.clinicalDiagnosis || 'В процессе...'}</p>
            </div>
            
            <div className="p-4" style={{ background: patient.status === 'Выписан' ? 'var(--secondary-light)' : '#f8fafc', borderRadius: 'var(--radius-md)', border: patient.status === 'Выписан' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #e2e8f0' }}>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Заключительный</div>
              <p className="text-sm m-0 leading-relaxed text-slate-800">{patient.finalDiagnosis || 'Не вынесен'}</p>
            </div>

            {patient.complications && (
              <div className="p-4 mt-2 shadow-sm" style={{ background: '#fff1f2', borderRadius: 'var(--radius-md)', border: '1px solid #fecdd3' }}>
                <div className="flex items-center gap-1 mb-2">
                  <AlertCircle size={14} color="#e11d48" />
                  <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Осложнения и сопутствующие</div>
                </div>
                <p className="text-sm m-0 leading-relaxed text-rose-900" style={{ whiteSpace: 'pre-wrap' }}>{patient.complications}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Files */}
        <div className="card flex-col" style={{ gridColumn: 'span 1', maxHeight: '600px' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="text-lg m-0 text-primary">Файлы</h3>
          </div>

          <div className="p-3 flex-col gap-2" style={{ flex: 1, overflowY: 'auto' }}>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
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
              <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading}/>
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
                      <a href="#" onClick={(e) => handleFileClick(e, doc)} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {doc.originalName}
                      </a>
                      <div className="text-muted text-xs mt-1">
                        {new Date(doc.createdAt).toLocaleDateString()} {doc.uploader?.username ? `• загрузил(а) ${doc.uploader.username}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
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

        {/* History of Hospitalizations (Full Width) */}
        <div className="card p-4" style={{ gridColumn: 'span 3', marginBottom: '1rem' }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={20} className="text-primary" />
            <h3 className="text-lg m-0 text-primary">Предыдущие госпитализации</h3>
          </div>
          
          {(!patient.history || patient.history.length === 0) ? (
            <div className="text-center text-muted p-4" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <p className="m-0">История госпитализаций отсутствует</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Период</th>
                    <th style={{ padding: '10px' }}>№ ИБ</th>
                    <th style={{ padding: '10px' }}>Отделение</th>
                    <th style={{ padding: '10px' }}>Заключительный диагноз</th>
                    <th style={{ padding: '10px' }}>Статус</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.history.map(hist => (
                    <tr key={hist.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px' }}>
                        {new Date(hist.admissionDate).toLocaleDateString()} — {hist.dischargeDate ? new Date(hist.dischargeDate).toLocaleDateString() : '...'}
                      </td>
                      <td style={{ padding: '10px', fontWeight: '500' }}>{hist.caseHistoryNumber || '—'}</td>
                      <td style={{ padding: '10px' }}>{hist.department}</td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={hist.finalDiagnosis || hist.clinicalDiagnosis || 'Нет диагноза'}>
                          {hist.finalDiagnosis || hist.clinicalDiagnosis || <span className="text-muted">Нет диагноза</span>}
                        </div>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem',
                          background: hist.status === 'Выписан' ? '#dcfce3' : 'var(--primary-light)',
                          color: hist.status === 'Выписан' ? '#166534' : 'var(--primary-dark)'
                        }}>
                          {hist.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* History of Consultations (Full Width) */}
        <div className="card p-4" style={{ gridColumn: 'span 3' }}>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={20} className="text-secondary" />
            <h3 className="text-lg m-0" style={{ color: 'var(--secondary)' }}>История амбулаторных консультаций</h3>
          </div>
          
          {(!patient.consultations || patient.consultations.length === 0) ? (
            <div className="text-center text-muted p-4" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <p className="m-0">История консультаций отсутствует</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Дата приема</th>
                    <th style={{ padding: '10px' }}>Диагноз</th>
                    <th style={{ padding: '10px' }}>Следующий визит</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.consultations.map(consult => (
                    <tr key={consult.id} style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }} onClick={() => { window.scrollTo(0, 0); navigate(`/consultations/${consult.id}/edit`); }}>
                      <td style={{ padding: '10px' }}>
                        {new Date(consult.consultationDate).toLocaleDateString('ru-RU')}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={consult.diagnosis || 'Нет диагноза'}>
                          {consult.diagnosis || <span className="text-muted">Нет диагноза</span>}
                        </div>
                      </td>
                      <td style={{ padding: '10px' }}>
                        {consult.nextConsultationDate ? new Date(consult.nextConsultationDate).toLocaleDateString('ru-RU') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
