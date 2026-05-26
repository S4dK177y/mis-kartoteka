import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../api';
import { Save, ArrowLeft, Trash2, Upload, Download, FileText, Image, FileArchive, FileAudio, FileVideo, File as FileIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ru } from 'date-fns/locale';
import { usePhoneMask } from '../hooks/usePhoneMask';
import { Card, Button } from '../components/ui';

import { PatientDataSection } from './consultation/PatientDataSection';
import { AnamnesisSection } from './consultation/AnamnesisSection';
import { ObjectiveStatusSection } from './consultation/ObjectiveStatusSection';
import { VVKSection } from './consultation/VVKSection';

export default function ConsultationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = Boolean(id);
  const prefillData = location.state?.prefillData || null;
  const { handlePhoneChange } = usePhoneMask();
  
  const [formData, setFormData] = useState({
    personId: prefillData?.personId || '',
    tokenNumber: prefillData?.tokenNumber || '',
    rank: prefillData?.rank || '',
    militaryUnit: prefillData?.militaryUnit || '',
    militaryStatus: prefillData?.militaryStatus || 'Призыв',
    isSvoParticipant: prefillData?.isSvoParticipant || false,
    fullName: prefillData?.fullName || '',
    address: prefillData?.address || '',
    phoneNumber: prefillData?.phoneNumber || '',
    relativeRelation: prefillData?.relativeRelation || '',
    relativeFullName: prefillData?.relativeFullName || '',
    relativePhone: prefillData?.relativePhone || '',
    relativeAddress: prefillData?.relativeAddress || '',
    diagnosis: '',
    notes: '',
    objectiveStatus: '', // New field, might need backend support later
    type: 'REGULAR',
  });
  
  const [vvkConclusion, setVvkConclusion] = useState({
    status: 'IN_PROGRESS',
    neurologistCategory: '',
    ophthalmologistCategory: '',
    dentistCategory: '',
    surgeonCategory: '',
    therapistCategory: '',
    finalCategory: '',
    medicalLeaveDays: '',
    isMedicalLeave: false
  });
  
  const [consultationDate, setConsultationDate] = useState(new Date());
  const [nextConsultationDate, setNextConsultationDate] = useState(null);
  const [birthDate, setBirthDate] = useState(prefillData?.birthDate ? new Date(prefillData.birthDate) : null);
  const [documents, setDocuments] = useState([]);
  const [archiveDocuments, setArchiveDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingVvk, setUploadingVvk] = useState(false);
  const [vvkDocument, setVvkDocument] = useState(null);
  const [loading, setLoading] = useState(isEditing);

  const isOtherRank = ['Пенсионер МО РФ', 'Член семьи военнослужащего', 'Другие'].includes(formData.rank);

  useEffect(() => {
    if (isEditing) fetchConsultation();
  }, [id]);

  const fetchConsultation = async () => {
    if (!id) return;
    try {
      const data = await api.getConsultation(id);
      if (!data) throw new Error("Консультация не найдена");

      setFormData({
        personId: data.personId || '',
        tokenNumber: data.tokenNumber || '',
        rank: data.rank || '',
        militaryUnit: data.militaryUnit || '',
        militaryStatus: data.militaryStatus || 'Призыв',
        isSvoParticipant: data.isSvoParticipant || false,
        fullName: data.fullName,
        address: data.address || '',
        phoneNumber: data.phoneNumber || '',
        relativeRelation: data.relativeRelation || '',
        relativeFullName: data.relativeFullName || '',
        relativePhone: data.relativePhone || '',
        relativeAddress: data.relativeAddress || '',
        diagnosis: data.diagnosis || '',
        notes: data.notes || '',
        objectiveStatus: data.objectiveStatus || '',
        type: data.type || 'REGULAR'
      });

      if (data.vvkConclusion) {
        setVvkConclusion({
          status: data.vvkConclusion.status || 'IN_PROGRESS',
          neurologistCategory: data.vvkConclusion.neurologistCategory || '',
          ophthalmologistCategory: data.vvkConclusion.ophthalmologistCategory || '',
          dentistCategory: data.vvkConclusion.dentistCategory || '',
          surgeonCategory: data.vvkConclusion.surgeonCategory || '',
          therapistCategory: data.vvkConclusion.therapistCategory || '',
          finalCategory: data.vvkConclusion.finalCategory || '',
          medicalLeaveDays: data.vvkConclusion.medicalLeaveDays || '',
          isMedicalLeave: !!data.vvkConclusion.medicalLeaveDays
        });
      }

      setConsultationDate(new Date(data.consultationDate));
      
      const bd = new Date(data.birthDate);
      setBirthDate(isNaN(bd.getTime()) ? null : bd);

      if (data.nextConsultationDate) setNextConsultationDate(new Date(data.nextConsultationDate));
      
      if (data.documents) {
        setDocuments(data.documents);
        const vvkDoc = data.documents.find(d => data.vvkConclusion && d.id === data.vvkConclusion.documentId);
        if (vvkDoc) setVvkDocument(vvkDoc);
      }
      if (data.archiveDocuments) setArchiveDocuments(data.archiveDocuments);
    } catch (error) {
      alert('Ошибка при загрузке данных консультации');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    if (name === 'tokenNumber') return setFormData(prev => ({ ...prev, [name]: val.toUpperCase() }));
    
    if (name === 'militaryStatus') {
      if (val === 'Призыв') return setFormData(prev => ({ ...prev, [name]: val, isSvoParticipant: false }));
      return setFormData(prev => ({ ...prev, [name]: val }));
    }

    if (name === 'rank') {
      const isOther = ['Пенсионер МО РФ', 'Член семьи военнослужащего', 'Другие'].includes(val);
      return setFormData(prev => ({ 
        ...prev, [name]: val, militaryStatus: isOther ? '' : (prev.militaryStatus || 'Призыв'),
        isSvoParticipant: isOther ? false : prev.isSvoParticipant
      }));
    }

    if (name === 'phoneNumber' || name === 'relativePhone') return handlePhoneChange(e, setFormData);

    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleVvkChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setVvkConclusion(prev => {
      const next = { ...prev, [name]: val };
      if (name !== 'finalCategory' && name !== 'medicalLeaveDays' && name !== 'isMedicalLeave') {
        if (!next.isMedicalLeave) {
          const cats = [next.neurologistCategory, next.ophthalmologistCategory, next.dentistCategory, next.surgeonCategory, next.therapistCategory].filter(Boolean);
          if (cats.length === 5) {
            const getScore = (c) => {
              const letter = c.charAt(0).toUpperCase();
              const num = parseInt(c.slice(2)) || 0;
              const map = { 'А': 10, 'Б': 20, 'В': 30, 'Г': 40, 'Д': 50 };
              return (map[letter] || 0) + num;
            };
            const sortedCats = [...cats].sort((a, b) => getScore(b) - getScore(a));
            next.finalCategory = sortedCats[0];
          }
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!birthDate) return alert("Пожалуйста, введите корректную дату рождения");

    try {
      const submissionData = {
        ...formData,
        consultationDate: consultationDate.toISOString(),
        birthDate: birthDate.toISOString(),
        nextConsultationDate: nextConsultationDate ? nextConsultationDate.toISOString() : null,
        vvkConclusion: formData.type === 'VVK' ? {
          status: vvkConclusion.status,
          neurologistCategory: vvkConclusion.neurologistCategory || null,
          ophthalmologistCategory: vvkConclusion.ophthalmologistCategory || null,
          dentistCategory: vvkConclusion.dentistCategory || null,
          surgeonCategory: vvkConclusion.surgeonCategory || null,
          therapistCategory: vvkConclusion.therapistCategory || null,
          finalCategory: vvkConclusion.isMedicalLeave ? 'Г' : (vvkConclusion.finalCategory || null),
          medicalLeaveDays: vvkConclusion.isMedicalLeave ? (parseInt(vvkConclusion.medicalLeaveDays) || 0) : null
        } : null
      };

      if (formData.type === 'VVK' && vvkConclusion.status === 'COMPLETED') {
        const reqFields = ['neurologistCategory', 'ophthalmologistCategory', 'dentistCategory', 'surgeonCategory', 'therapistCategory'];
        if (!reqFields.every(f => vvkConclusion[f])) return alert("Для завершения ВВК необходимо заполнить решения всех 5 врачей.");
        if (vvkConclusion.isMedicalLeave && !vvkConclusion.medicalLeaveDays) return alert("Укажите количество суток отпуска по болезни.");
        if (!vvkConclusion.isMedicalLeave && !vvkConclusion.finalCategory) return alert("Укажите итоговую категорию ВВК.");
      }

      if (isEditing) await api.updateConsultation(id, submissionData);
      else await api.createConsultation(submissionData);
      navigate('/consultations');
    } catch (error) {
      alert('Ошибка при сохранении');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись о консультации?')) {
      try {
        await api.deleteConsultation(id);
        navigate('/consultations');
      } catch {
        alert('Ошибка при удалении');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadConsultationDocument(id, file);
      await fetchConsultation();
    } catch {
      alert('Ошибка при загрузке файла');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = null; 
    }
  };

  const handleVvkFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingVvk(true);
    try {
      await api.uploadConsultationVvkDocument(id, file);
      await fetchConsultation();
    } catch (error) {
      alert(`Ошибка при загрузке скана заключения ВВК: ${error.message}`);
    } finally {
      setUploadingVvk(false);
      if (e.target) e.target.value = null; 
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploading(true);
      try {
        await api.uploadConsultationDocument(id, file);
        await fetchConsultation();
      } catch {
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
        await fetchConsultation();
      } catch {
        alert('Ошибка при удалении файла');
      }
    }
  };

  if (loading) return <div className="p-6 text-center text-muted">Загрузка...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="flex items-center gap-4 mb-4 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" className="btn-icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </Button>
          <h2 className="text-xl m-0">{isEditing ? 'Редактирование консультации' : 'Новая консультация'}</h2>
        </div>
        {isEditing && (
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={16} /> Удалить
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-4 mb-4 pb-2 border-b">
            <h3 className="text-lg m-0 text-primary">Тип приема</h3>
            <div className="flex gap-4 ml-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value="REGULAR" checked={formData.type === 'REGULAR'} onChange={handleChange} />
                <span>Обычный прием</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value="VVK" checked={formData.type === 'VVK'} onChange={handleChange} />
                <span style={{ fontWeight: 600 }}>ВВК</span>
              </label>
            </div>
          </div>
          <PatientDataSection 
            formData={formData} 
            handleChange={handleChange} 
            birthDate={birthDate} 
            setBirthDate={setBirthDate} 
            isOtherRank={isOtherRank} 
          />
        </Card>

        <Card className="p-4 mb-4">
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Дата и время приема *</label>
              <DatePicker selected={consultationDate} onChange={setConsultationDate} showTimeSelect timeFormat="HH:mm" timeIntervals={5} dateFormat="dd.MM.yyyy HH:mm" locale={ru} className="input-field" required />
            </div>
            <div className="input-group">
              <label className="input-label">Дата следующего визита</label>
              <DatePicker selected={nextConsultationDate} onChange={setNextConsultationDate} showTimeSelect timeFormat="HH:mm" timeIntervals={5} dateFormat="dd.MM.yyyy HH:mm" locale={ru} className="input-field" isClearable placeholderText="Не назначена" />
            </div>
          </div>
          <AnamnesisSection formData={formData} handleChange={handleChange} />
          <ObjectiveStatusSection formData={formData} handleChange={handleChange} />
        </Card>

        {formData.type === 'VVK' && (
          <VVKSection 
            vvkConclusion={vvkConclusion} 
            handleVvkChange={handleVvkChange} 
            isEditing={isEditing} 
            vvkDocument={vvkDocument} 
            uploadingVvk={uploadingVvk} 
            handleVvkFileUpload={handleVvkFileUpload} 
            handleDeleteVvkDocument={handleDeleteDocument} 
          />
        )}

        <Card className="p-4 mb-4">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <FileText size={20} className="text-primary" />
            <h3 className="text-lg m-0 text-primary">Файлы приема</h3>
          </div>
          {!isEditing ? (
            <div className="text-center text-muted p-4" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <p className="m-0">Сохраните амбулаторный прием, чтобы получить возможность прикреплять файлы.</p>
            </div>
          ) : (
            <div className="flex-col gap-4">
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} style={{ border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-light)', background: isDragging ? 'var(--primary-light)' : 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '1.5rem 1rem', textAlign: 'center', transition: 'all 0.2s' }}>
                <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading}/>
                <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={24} style={{ color: isDragging ? 'var(--primary)' : 'var(--text-muted)' }} />
                  <span className="text-sm text-muted">{uploading ? 'Загрузка...' : 'Перетащите файл сюда или нажмите для выбора'}</span>
                </label>
              </div>

              {documents.length === 0 ? (
                <div className="text-center text-muted p-4">
                  <FileText size={24} className="mx-auto mb-1 opacity-50" />
                  <p className="text-xs">Нет загруженных файлов</p>
                </div>
              ) : (
                <div className="grid-2 gap-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-3" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <div className="flex items-center gap-3" style={{ overflow: 'hidden' }}>
                        {(() => {
                          const lowerName = doc.originalName.toLowerCase();
                          const lowerMime = doc.mimeType.toLowerCase();
                          if (lowerName.endsWith('.pdf')) return <FileText size={20} style={{ color: '#ef4444', flexShrink: 0 }} />;
                          if (lowerMime.startsWith('image/')) return <Image size={20} style={{ color: '#0ea5e9', flexShrink: 0 }} />;
                          if (lowerMime.startsWith('video/')) return <FileVideo size={20} style={{ color: '#a855f7', flexShrink: 0 }} />;
                          if (lowerMime.startsWith('audio/')) return <FileAudio size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />;
                          if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) return <FileArchive size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />;
                          if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return <FileText size={20} style={{ color: '#2563eb', flexShrink: 0 }} />;
                          if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return <FileText size={20} style={{ color: '#10b981', flexShrink: 0 }} />;
                          return <FileIcon size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />;
                        })()}
                        <div className="flex-col" style={{ overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={doc.originalName}>{doc.originalName}</span>
                          <div className="text-muted text-xs mt-1">{new Date(doc.createdAt).toLocaleDateString()} {doc.uploader?.username ? `• загрузил(а) ${doc.uploader.username}` : ''}</div>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <a href={api.getDocumentUrl(doc.id)} className="btn btn-icon btn-outline" style={{ color: 'var(--primary)', borderColor: 'transparent', padding: '0.3rem' }} title="Скачать" target="_blank" rel="noopener noreferrer"><Download size={16} /></a>
                        <button type="button" className="btn btn-icon btn-outline" style={{ color: 'var(--danger)', borderColor: 'transparent', padding: '0.3rem' }} onClick={() => handleDeleteDocument(doc.id)} title="Удалить"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>Отмена</Button>
          <Button variant="primary" type="submit">
            <Save size={16} /> Сохранить
          </Button>
        </div>
      </form>
    </div>
  );
}
