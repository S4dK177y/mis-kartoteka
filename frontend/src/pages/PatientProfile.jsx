import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, Trash2, RefreshCw, LogOut, FilePlus, X, File as FileIcon, Download 
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ru } from 'date-fns/locale';
import { api } from '../api';
import { usePatient } from '../hooks/usePatient';
import { Document, Page, pdfjs } from 'react-pdf';
import { useInView } from 'react-intersection-observer';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { DEPARTMENTS } from './PatientForm';
import ICD10Autocomplete from '../components/ICD10Autocomplete';

import { PatientSummaryCard } from './patient/PatientSummaryCard';
import { ConsultationsHistory } from './patient/ConsultationsHistory';
import { DocumentsManager } from './patient/DocumentsManager';
import { Button, DocumentViewer } from '../components/ui';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const {
    patient, loading, uploading, error,
    fetchPatient, deletePatient, uploadDocument, deleteDocument, transferPatient, dischargePatient
  } = usePatient(id);

  const [isDragging, setIsDragging] = useState(false);
  const [consultationTypeFilter, setConsultationTypeFilter] = useState('ALL');
  
  const [showTransfer, setShowTransfer] = useState(false);
  const [showDischarge, setShowDischarge] = useState(false);
  
  const [transferData, setTransferData] = useState({ department: DEPARTMENTS[0], date: new Date() });
  const [dischargeData, setDischargeData] = useState({ date: new Date(), destination: '', finalDiagnosis: '' });
  
  const [viewingFile, setViewingFile] = useState(null);
  const [numPages, setNumPages] = useState(null);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  useEffect(() => {
    if (patient) {
      setDischargeData(prev => ({
        ...prev,
        finalDiagnosis: patient.finalDiagnosis || patient.clinicalDiagnosis || patient.admissionDiagnosis || ''
      }));
    }
  }, [patient]);

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить эту карту пациента? Это действие необратимо.')) {
      const success = await deletePatient();
      if (success) navigate('/');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadDocument(file);
      if (e.target) e.target.value = null; 
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadDocument(file);
  };

  const handleDeleteDocument = async (docId) => {
    if (window.confirm('Удалить этот документ?')) {
      await deleteDocument(docId);
    }
  };

  const handleFileClick = (e, doc) => {
    e.preventDefault();
    if (doc.mimeType.startsWith('image/') || doc.mimeType === 'application/pdf') {
      setViewingFile(doc);
      setNumPages(null);
    } else {
      window.open(api.getDocumentUrl(doc.id), '_blank');
    }
  };

  const handleTransfer = async () => {
    const success = await transferPatient(transferData.department, transferData.date.toISOString());
    if (success) setShowTransfer(false);
  };

  const handleDischarge = async () => {
    const success = await dischargePatient(dischargeData);
    if (success) setShowDischarge(false);
  };

  const handleReadmission = () => {
    navigate('/patients/new', { 
      state: { 
        readmissionData: {
          personId: patient.personId, fullName: patient.fullName, birthDate: patient.birthDate,
          tokenNumber: patient.tokenNumber, rank: patient.rank, militaryUnit: patient.militaryUnit,
          militaryStatus: patient.militaryStatus, isSvoParticipant: patient.isSvoParticipant, address: patient.address
        }
      }
    });
  };

  if (loading || !patient) return <div className="p-6 text-center text-muted">Загрузка...</div>;
  if (error) return <div className="p-6 text-center text-danger">{error}</div>;

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
              <Button variant="outline" style={{ color: 'var(--primary-hover)', borderColor: 'var(--primary-light)' }} onClick={() => { setShowTransfer(!showTransfer); setShowDischarge(false); }}>
                <RefreshCw size={14} /> Перевод в другое отд.
              </Button>
              <Button variant="outline" style={{ color: 'var(--secondary-hover)', borderColor: 'var(--secondary-light)' }} onClick={() => { setShowDischarge(!showDischarge); setShowTransfer(false); }}>
                <LogOut size={14} /> Выписка / Перевод
              </Button>
            </>
          ) : (
            <Button variant="outline" style={{ color: 'var(--primary-hover)', borderColor: 'var(--primary-light)' }} onClick={handleReadmission}>
              <FilePlus size={14} /> Повторная госпитализация
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(`/patients/${id}/edit`)}>
            <Edit2 size={14} /> Изменить
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={14} /> Удалить
          </Button>
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
              <DatePicker selected={transferData.date} onChange={(date) => setTransferData({...transferData, date})} showTimeSelect timeFormat="HH:mm" timeIntervals={5} dateFormat="dd.MM.yyyy HH:mm" locale={ru} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowTransfer(false)}>Отмена</Button>
            <Button variant="primary" onClick={handleTransfer}>Сохранить</Button>
          </div>
        </div>
      )}

      {showDischarge && (
        <div className="card p-4 mb-4 animate-fade-in" style={{ border: '2px solid var(--secondary-light)', overflow: 'visible', zIndex: 10, position: 'relative' }}>
          <h3 className="text-lg mb-3">Оформление выписки / перевода</h3>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Дата и время выписки</label>
              <DatePicker selected={dischargeData.date} onChange={(date) => setDischargeData({...dischargeData, date})} showTimeSelect timeFormat="HH:mm" timeIntervals={5} dateFormat="dd.MM.yyyy HH:mm" locale={ru} className="input-field" />
            </div>
            <div className="input-group">
              <label className="input-label">Куда направлен</label>
              <input type="text" className="input-field" placeholder="Например: домой с улучшением" value={dischargeData.destination} onChange={e => setDischargeData({...dischargeData, destination: e.target.value})} />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <ICD10Autocomplete label="Заключительный диагноз (МКБ-10)" name="finalDiagnosis" value={dischargeData.finalDiagnosis} onChange={(e) => setDischargeData({...dischargeData, finalDiagnosis: e.target.value})} required />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowDischarge(false)}>Отмена</Button>
            <Button variant="secondary" onClick={handleDischarge}>Сохранить</Button>
          </div>
        </div>
      )}

      <div className="grid-3">
        <PatientSummaryCard patient={patient} />
        <DocumentsManager 
          patient={patient} 
          uploading={uploading} 
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileUpload={handleFileUpload}
          onDeleteDocument={handleDeleteDocument}
          onFileClick={handleFileClick}
        />
        <ConsultationsHistory 
          patient={patient}
          consultationTypeFilter={consultationTypeFilter}
          setConsultationTypeFilter={setConsultationTypeFilter}
        />
      </div>

      <DocumentViewer 
        file={viewingFile} 
        isOpen={!!viewingFile} 
        onClose={() => setViewingFile(null)} 
      />
    </div>
  );
}
