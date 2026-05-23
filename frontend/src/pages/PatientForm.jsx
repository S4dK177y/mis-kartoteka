import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { Save, ArrowLeft } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ru } from 'date-fns/locale';
import InputMask from 'react-input-mask';
import ICD10Autocomplete from '../components/ICD10Autocomplete';
import { MILITARY_RANKS } from '../ranks';

export const DEPARTMENTS = [
  'Неврологическое отделение (НО)',
  'Хирургическое отделение (ХО)',
  'Оториноларингологическое отделение (ЛОР)',
  'Терапевтическое №1 (ТО1)',
  'Терапевтическое №2 (ТО2)',
  'Инфекционное №1 (ИО1)',
  'Инфекционное №2 (ИО2)',
  'Отделение анестезиологии и реанимации (ОАиР)',
  'Госпитальное отделение (ГО)'
];

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState({
    tokenNumber: '',
    caseHistoryNumber: '',
    rank: '',
    militaryUnit: '',
    militaryStatus: 'Призыв',
    isSvoParticipant: false,
    fullName: '',
    address: '',
    admissionDiagnosis: '',
    clinicalDiagnosis: '',
    finalDiagnosis: '',
    complications: '',
    department: DEPARTMENTS[0],
    status: 'На лечении'
  });
  
  const [admissionDate, setAdmissionDate] = useState(new Date());
  // We handle birthDate manually to use masking easily if datepicker customInput acts up, 
  // but datepicker has issues with strict masks sometimes. 
  // Let's use string state for the mask.
  const [birthDateString, setBirthDateString] = useState('');

  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      fetchPatient();
    }
  }, [id]);

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
        admissionDiagnosis: data.admissionDiagnosis || '',
        clinicalDiagnosis: data.clinicalDiagnosis || '',
        finalDiagnosis: data.finalDiagnosis || '',
        complications: data.complications || '',
        department: data.department || DEPARTMENTS[0],
        status: data.status
      });
      setAdmissionDate(new Date(data.admissionDate));
      
      const bd = new Date(data.birthDate);
      const d = String(bd.getDate()).padStart(2, '0');
      const m = String(bd.getMonth() + 1).padStart(2, '0');
      const y = bd.getFullYear();
      setBirthDateString(`${d}.${m}.${y}`);
    } catch (error) {
      console.error(error);
      alert('Ошибка при загрузке данных пациента');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    
    // Token validation enforcing upper case and pattern A-0000 / AA-00000
    if (name === 'tokenNumber') {
      let val = value.toUpperCase();
      val = val.replace(/[^А-ЯA-Z0-9-]/g, '');
      setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Parse birth date
    const parts = birthDateString.split('.');
    if (parts.length !== 3 || parts[2].includes('_')) {
      alert("Пожалуйста, введите корректную дату рождения (ДД.ММ.ГГГГ)");
      return;
    }
    const parsedBd = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
    if (isNaN(parsedBd.getTime())) {
      alert("Некорректная дата рождения");
      return;
    }

    if (formData.tokenNumber) {
      const tokenRegex = /^[А-ЯA-Z]{1,2}-\d+$/;
      if (!tokenRegex.test(formData.tokenNumber)) {
        alert("Жетон должен быть в формате 'А-000000' или 'АА-000000'");
        return;
      }
    }

    try {
      const submissionData = {
        ...formData,
        admissionDate: admissionDate.toISOString(),
        birthDate: parsedBd.toISOString()
      };

      if (isEditing) {
        await api.updatePatient(id, submissionData);
        navigate(`/patients/${id}`);
      } else {
        const newPatient = await api.createPatient(submissionData);
        navigate(`/patients/${newPatient.id}`);
      }
    } catch (error) {
      console.error(error);
      alert('Ошибка при сохранении');
    }
  };

  if (loading) return <div className="p-6 text-center text-muted">Загрузка...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="flex items-center gap-4 mb-4">
        <button className="btn btn-icon btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-xl m-0">{isEditing ? 'Редактирование пациента' : 'Новая запись пациента'}</h2>
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
              <InputMask
                mask="99.99.9999"
                value={birthDateString}
                onChange={(e) => setBirthDateString(e.target.value)}
                placeholder="ДД.ММ.ГГГГ"
                className="input-field"
                required
              />
            </div>
          </div>
          
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Воинское звание</label>
              <select name="rank" className="input-field" value={formData.rank} onChange={handleChange}>
                <option value="">Не указано</option>
                {MILITARY_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="militaryStatus" value="Призыв" checked={formData.militaryStatus === 'Призыв'} onChange={handleChange} />
                  <span>По призыву</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="militaryStatus" value="Контракт" checked={formData.militaryStatus === 'Контракт'} onChange={handleChange} />
                  <span>По контракту</span>
                </label>
              </div>
            </div>
            
            {formData.militaryStatus === 'Контракт' && (
              <div className="input-group mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
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
