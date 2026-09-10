import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../api';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ru } from 'date-fns/locale';
import ICD10Autocomplete from '../components/ICD10Autocomplete';
import { MILITARY_RANKS_GROUPS } from '../ranks';
import { usePhoneMask } from '../hooks/usePhoneMask';

import { DEPARTMENTS } from '../constants';

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = Boolean(id);
  const readmissionData = location.state?.readmissionData || null;
  const { handlePhoneChange } = usePhoneMask();
  
  const [formData, setFormData] = useState({
    personId: readmissionData?.personId || '',
    tokenNumber: readmissionData?.tokenNumber || '',
    caseHistoryNumber: '',
    rank: readmissionData?.rank || '',
    militaryUnit: readmissionData?.militaryUnit || '',
    militaryStatus: readmissionData?.militaryStatus || 'Призыв',
    isSvoParticipant: readmissionData?.isSvoParticipant || false,
    fullName: readmissionData?.fullName || '',
    address: readmissionData?.address || '',
    phoneNumber: readmissionData?.phoneNumber || '',
    relativeRelation: readmissionData?.relativeRelation || '',
    relativeFullName: readmissionData?.relativeFullName || '',
    relativePhone: readmissionData?.relativePhone || '',
    relativeAddress: readmissionData?.relativeAddress || '',
    admissionDiagnosis: '',
    clinicalDiagnosis: '',
    finalDiagnosis: '',
    complications: '',
    department: DEPARTMENTS[0],
    status: 'На лечении'
  });
  
  const [admissionDate, setAdmissionDate] = useState(new Date());
  const [birthDate, setBirthDate] = useState(readmissionData?.birthDate ? new Date(readmissionData.birthDate) : null);

  const [loading, setLoading] = useState(isEditing);

  const isOtherRank = ['Пенсионер МО РФ', 'Член семьи военнослужащего', 'Другие'].includes(formData.rank);

  const fetchPatient = async () => {
    try {
      const data = await api.getPatient(id);
      setFormData({
        tokenNumber: data.tokenNumber || '',
        caseHistoryNumber: data.caseHistoryNumber || '',
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
        admissionDiagnosis: data.admissionDiagnosis || '',
        clinicalDiagnosis: data.clinicalDiagnosis || '',
        finalDiagnosis: data.finalDiagnosis || '',
        complications: data.complications || '',
        department: data.department || DEPARTMENTS[0],
        status: data.status
      });
      setAdmissionDate(new Date(data.admissionDate));
      
      const bd = new Date(data.birthDate);
      setBirthDate(isNaN(bd.getTime()) ? null : bd);
    } catch (error) {
      console.error(error);
      toast.error('Ошибка при загрузке данных пациента');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditing) {
      fetchPatient();
    }
  }, [id]);


  const handleChange = (e) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    
    // Token validation enforcing upper case
    if (name === 'tokenNumber') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
      return;
    }
    
    // Reset SVO when switching to Призыв
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!birthDate) {
      toast.error("Пожалуйста, введите корректную дату рождения");
      return;
    }

    try {
      const submissionData = {
        ...formData,
        admissionDate: admissionDate.toISOString(),
        birthDate: birthDate.toISOString()
      };

      if (isEditing) {
        await api.updatePatient(id, submissionData);
        toast.success('Данные пациента обновлены');
        navigate(`/patients/${id}`);
      } else {
        const newPatient = await api.createPatient(submissionData);
        toast.success('Пациент успешно создан');
        navigate(`/patients/${newPatient.id}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Ошибка при сохранении');
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
          <h2 className="text-xl m-0">{isEditing ? 'Редактирование госпитализации' : 'Новая госпитализация'}</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card p-4 mb-4">
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
              <label className="input-label">Воинское звание</label>
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
            <div className="input-group">
              <label className="input-label">№ Истории Болезни</label>
              <input type="text" name="caseHistoryNumber" className="input-field" value={formData.caseHistoryNumber} onChange={handleChange} />
            </div>
          </div>

          <div className="input-group mt-2" style={{ margin: 0 }}>
            <label className="input-label">Адрес проживания</label>
            <input type="text" name="address" className="input-field" value={formData.address} onChange={handleChange} />
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
            {!isEditing && (
              <div className="input-group">
                <label className="input-label">Отделение (при поступлении) *</label>
                <select name="department" className="input-field" value={formData.department} onChange={handleChange}>
                  {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
              </div>
            )}
            
            <div className="input-group">
              <label className="input-label">Дата и время поступления *</label>
              <DatePicker
                selected={admissionDate}
                onChange={(date) => setAdmissionDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={5}
                dateFormat="dd.MM.yyyy HH:mm"
                locale={ru}
                className="input-field"
                required
              />
            </div>
          </div>

          <ICD10Autocomplete label="Диагноз при поступлении (МКБ-10)" name="admissionDiagnosis" value={formData.admissionDiagnosis} onChange={handleChange} />
          <ICD10Autocomplete label="Клинический диагноз (МКБ-10)" name="clinicalDiagnosis" value={formData.clinicalDiagnosis} onChange={handleChange} />
          <ICD10Autocomplete label="Заключительный диагноз (МКБ-10)" name="finalDiagnosis" value={formData.finalDiagnosis} onChange={handleChange} />
          
          <div className="input-group mt-2 mb-0">
            <label className="input-label">Осложнения и сопутствующие заболевания</label>
            <textarea 
              name="complications" 
              className="input-field" 
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={formData.complications} 
              onChange={handleChange}
              placeholder="Введите сопутствующие диагнозы и осложнения..."
            ></textarea>
          </div>
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
