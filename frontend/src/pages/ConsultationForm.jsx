import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../api';
import { Save, ArrowLeft, Trash2, Upload, Download, FileText, Image, FileArchive, FileAudio, FileVideo, File as FileIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ru } from 'date-fns/locale';
import ICD10Autocomplete from '../components/ICD10Autocomplete';
import { MILITARY_RANKS_GROUPS } from '../ranks';
import { usePhoneMask } from '../hooks/usePhoneMask';

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
    if (isEditing) {
      fetchConsultation();
    }
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

      if (data.nextConsultationDate) {
        setNextConsultationDate(new Date(data.nextConsultationDate));
      }
      
      if (data.documents) {
        setDocuments(data.documents);
        const vvkDoc = data.documents.find(d => data.vvkConclusion && d.id === data.vvkConclusion.documentId);
        if (vvkDoc) {
          setVvkDocument(vvkDoc);
        }
      }
      if (data.archiveDocuments) {
        setArchiveDocuments(data.archiveDocuments);
      }
    } catch (error) {
      console.error(error);
      alert('Ошибка при загрузке данных консультации');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    
    if (name === 'tokenNumber') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
      return;
    }
    
    if (name === 'militaryStatus') {
      if (value === 'Призыв') {
        setFormData(prev => ({ ...prev, [name]: value, isSvoParticipant: false }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
      return;
    }

    if (name === 'rank') {
      const isOther = ['Пенсионер МО РФ', 'Член семьи военнослужащего', 'Другие'].includes(value);
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        militaryStatus: isOther ? '' : (prev.militaryStatus || 'Призыв'),
        isSvoParticipant: isOther ? false : prev.isSvoParticipant
      }));
      return;
    }

    if (name === 'phoneNumber' || name === 'relativePhone') {
      handlePhoneChange(e, setFormData);
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVvkChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setVvkConclusion(prev => {
      const next = { ...prev, [name]: val };
      
      // Auto-calculate final category if all 5 are filled
      if (name !== 'finalCategory' && name !== 'medicalLeaveDays' && name !== 'isMedicalLeave') {
        // Auto-calculate final category if all 5 are filled and we're completing or just updating
        if (!next.isMedicalLeave) {
          const cats = [
            next.neurologistCategory, next.ophthalmologistCategory, 
            next.dentistCategory, next.surgeonCategory, next.therapistCategory
          ].filter(Boolean);
          
          if (cats.length === 5) {
            // Priority: Д > Г > В > Б > А. And within letter: 4 > 3 > 2 > 1.
            const getScore = (c) => {
              const letter = c.charAt(0).toUpperCase();
              const num = parseInt(c.slice(2)) || 0;
              const map = { 'А': 10, 'Б': 20, 'В': 30, 'Г': 40, 'Д': 50 };
              return (map[letter] || 0) + num;
            };
            const sortedCats = [...cats].sort((a, b) => getScore(b) - getScore(a)); // desc
            next.finalCategory = sortedCats[0];
          }
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!birthDate) {
      alert("Пожалуйста, введите корректную дату рождения");
      return;
    }

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
        const requiredFields = ['neurologistCategory', 'ophthalmologistCategory', 'dentistCategory', 'surgeonCategory', 'therapistCategory'];
        const isComplete = requiredFields.every(f => vvkConclusion[f]);
        if (!isComplete) {
          alert("Для завершения ВВК необходимо заполнить решения всех 5 врачей.");
          return;
        }
        if (vvkConclusion.isMedicalLeave && !vvkConclusion.medicalLeaveDays) {
          alert("Укажите количество суток отпуска по болезни для завершения.");
          return;
        }
        if (!vvkConclusion.isMedicalLeave && !vvkConclusion.finalCategory) {
          alert("Укажите итоговую категорию ВВК для завершения.");
          return;
        }
      }

      if (isEditing) {
        await api.updateConsultation(id, submissionData);
      } else {
        await api.createConsultation(submissionData);
      }
      navigate('/consultations');
    } catch (error) {
      console.error(error);
      alert('Ошибка при сохранении');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись о консультации?')) {
      try {
        await api.deleteConsultation(id);
        navigate('/consultations');
      } catch (error) {
        console.error(error);
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
    } catch (error) {
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
        await api.uploadConsultationDocument(id, file);
        await fetchConsultation();
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
        await fetchConsultation();
      } catch (error) {
        alert('Ошибка при удалении файла');
      }
    }
  };

  if (loading) return <div className="p-6 text-center text-muted">Загрузка...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="flex items-center gap-4 mb-4 justify-between">
        <div className="flex items-center gap-4">
          <button className="btn btn-icon btn-outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-xl m-0">{isEditing ? 'Редактирование консультации' : 'Новая консультация'}</h2>
        </div>
        {isEditing && (
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={16} /> Удалить
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card p-4 mb-4">
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

          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">ФИО (Полностью) *</label>
              <input type="text" name="fullName" className="input-field" required value={formData.fullName} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label className="input-label">Дата рождения *</label>
              <DatePicker
                selected={birthDate}
                onChange={(date) => setBirthDate(date)}
                dateFormat="dd.MM.yyyy"
                locale={ru}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                className="input-field"
                placeholderText="ДД.ММ.ГГГГ"
                required
              />
            </div>
          </div>
          
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Воинское звание / Категория</label>
              <select name="rank" className="input-field" value={formData.rank} onChange={handleChange}>
                <option value="">Не указано</option>
                {MILITARY_RANKS_GROUPS.map((group, idx) => (
                  <optgroup key={idx} label={group.label}>
                    {group.options.map(r => <option key={r} value={r}>{r}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Номер в/ч</label>
              <input type="text" name="militaryUnit" className="input-field" value={formData.militaryUnit} onChange={handleChange} />
            </div>
          </div>

          <div className="grid-2" style={{ alignItems: 'flex-start' }}>
            <div className="input-group">
              <label className="input-label">Статус службы</label>
              <div className="flex gap-4 mt-2">
                <label className={`flex items-center gap-2 ${isOtherRank ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="radio" name="militaryStatus" value="Призыв" checked={formData.militaryStatus === 'Призыв'} onChange={handleChange} disabled={isOtherRank} />
                  <span>По призыву</span>
                </label>
                <label className={`flex items-center gap-2 ${isOtherRank ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="radio" name="militaryStatus" value="Контракт" checked={formData.militaryStatus === 'Контракт'} onChange={handleChange} disabled={isOtherRank} />
                  <span>По контракту</span>
                </label>
              </div>
            </div>
            
            {formData.militaryStatus === 'Контракт' && (
              <div className="input-group">
                <label className="input-label" style={{ visibility: 'hidden' }}>Выравнивание</label>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input type="checkbox" name="isSvoParticipant" checked={formData.isSvoParticipant} onChange={handleChange} />
                  <span style={{ fontWeight: 600, color: 'var(--danger)' }}>Участник СВО</span>
                </label>
              </div>
            )}
          </div>

          <div className="grid-2 mt-2">
            <div className="input-group">
              <label className="input-label">Личный номер (Жетон)</label>
              <input type="text" name="tokenNumber" className="input-field" placeholder="АВ-123456" value={formData.tokenNumber} onChange={handleChange} />
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Адрес проживания</label>
              <input type="text" name="address" className="input-field" value={formData.address} onChange={handleChange} />
            </div>
          </div>
          
          <div className="input-group mt-4 mb-2">
            <label className="input-label">Номер телефона пациента</label>
            <input type="text" name="phoneNumber" className="input-field" value={formData.phoneNumber} onChange={handleChange} placeholder="+7-___-___-__-__" />
          </div>

          <div className="card p-4 mt-4" style={{ background: 'var(--bg-main)' }}>
            <h4 className="text-md font-bold mb-3 text-primary">Контактные данные близкого человека</h4>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Кем приходится (статус)</label>
                <input type="text" name="relativeRelation" className="input-field" value={formData.relativeRelation} onChange={handleChange} placeholder="Жена, Брат, Сын и т.д." />
              </div>
              <div className="input-group">
                <label className="input-label">ФИО близкого</label>
                <input type="text" name="relativeFullName" className="input-field" value={formData.relativeFullName} onChange={handleChange} placeholder="Иванова Мария Ивановна" />
              </div>
            </div>
            <div className="grid-2 mt-2">
              <div className="input-group">
                <label className="input-label">Номер телефона</label>
                <input type="text" name="relativePhone" className="input-field" value={formData.relativePhone} onChange={handleChange} placeholder="+7-___-___-__-__" />
              </div>
              <div className="input-group">
                <label className="input-label">Адрес проживания</label>
                <input type="text" name="relativeAddress" className="input-field" value={formData.relativeAddress} onChange={handleChange} placeholder="Город, Улица, Дом" />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4 mb-4">
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Дата и время приема *</label>
              <DatePicker
                selected={consultationDate}
                onChange={(date) => setConsultationDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={5}
                dateFormat="dd.MM.yyyy HH:mm"
                locale={ru}
                className="input-field"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Дата следующего визита</label>
              <DatePicker
                selected={nextConsultationDate}
                onChange={(date) => setNextConsultationDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={5}
                dateFormat="dd.MM.yyyy HH:mm"
                locale={ru}
                className="input-field"
                isClearable
                placeholderText="Не назначена"
              />
            </div>
          </div>

          <ICD10Autocomplete label="Диагноз (МКБ-10)" name="diagnosis" value={formData.diagnosis} onChange={handleChange} />
          
          <div className="input-group mt-2 mb-0">
            <label className="input-label">Жалобы, анамнез, рекомендации (заметки)</label>
            <textarea 
              name="notes" 
              className="input-field" 
              style={{ minHeight: '120px', resize: 'vertical' }}
              value={formData.notes} 
              onChange={handleChange}
              placeholder="Введите описание приема и рекомендации..."
            ></textarea>
          </div>
        </div>

        {formData.type === 'VVK' && (
          <div className="card p-6 mb-4" style={{ borderTop: '4px solid #3b82f6', boxShadow: 'var(--shadow-md)' }}>
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
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
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
                      <button type="button" className="btn btn-icon btn-danger" onClick={() => { handleDeleteDocument(vvkDocument.id); setVvkDocument(null); }}>
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
          </div>
        )}

        {/* Files Section */}
        <div className="card p-4 mb-4">
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
                          <span style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={doc.originalName}>
                            {doc.originalName}
                          </span>
                          <div className="text-muted text-xs mt-1">
                            {new Date(doc.createdAt).toLocaleDateString()} {doc.uploader?.username ? `• загрузил(а) ${doc.uploader.username}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <a href={api.getDocumentUrl(doc.id)} className="btn btn-icon" style={{ color: 'var(--primary)', background: 'transparent', padding: '0.3rem' }} title="Скачать" target="_blank" rel="noopener noreferrer">
                          <Download size={16} />
                        </a>
                        <button type="button" className="btn btn-icon" style={{ color: 'var(--danger)', background: 'transparent', padding: '0.3rem' }} onClick={() => handleDeleteDocument(doc.id)} title="Удалить">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Archive Documents Section */}
              {archiveDocuments && archiveDocuments.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileArchive size={18} className="text-muted" />
                    <h4 className="text-md m-0 text-muted">Архивные файлы (предыдущие обращения)</h4>
                  </div>
                  <div className="grid-2 gap-2">
                    {archiveDocuments.map(doc => (
                      <div key={doc.id} className="flex justify-between items-center p-3 opacity-80" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
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
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={doc.originalName}>
                              {doc.originalName}
                            </span>
                            <div className="text-muted text-xs mt-1">
                              {new Date(doc.createdAt).toLocaleDateString()}
                              {doc.consultationId && <span className="ml-1" title="Прикреплено к приему">(Прием)</span>}
                              {doc.patientId && <span className="ml-1" title="Прикреплено к госпитализации">(Госп.)</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <a href={api.getDocumentUrl(doc.id)} className="btn btn-icon" style={{ color: 'var(--primary)', background: 'transparent', padding: '0.3rem' }} title="Скачать" target="_blank" rel="noopener noreferrer">
                            <Download size={16} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Отмена</button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} /> Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}
