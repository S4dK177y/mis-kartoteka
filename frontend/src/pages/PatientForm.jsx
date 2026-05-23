import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { Save, ArrowLeft } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ru } from 'date-fns/locale';
import ICD10Autocomplete from '../components/ICD10Autocomplete';

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
    fullName: '',
    birthDate: '',
    address: '',
    admissionDiagnosis: '',
    clinicalDiagnosis: '',
    finalDiagnosis: '',
    department: DEPARTMENTS[0],
    status: 'На лечении'
  });
  const [admissionDate, setAdmissionDate] = useState(new Date());
  const [birthDate, setBirthDate] = useState(null);
  
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
        fullName: data.fullName,
        address: data.address || '',
        admissionDiagnosis: data.admissionDiagnosis || '',
        clinicalDiagnosis: data.clinicalDiagnosis || '',
        finalDiagnosis: data.finalDiagnosis || '',
        department: data.department || DEPARTMENTS[0],
        status: data.status
      });
      setAdmissionDate(new Date(data.admissionDate));
      setBirthDate(new Date(data.birthDate));
    } catch (error) {
      console.error(error);
      alert('Ошибка при загрузке данных пациента');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Token validation enforcing upper case and pattern A-0000 / AA-00000
    if (name === 'tokenNumber') {
      let val = value.toUpperCase();
      // Remove invalid chars
      val = val.replace(/[^А-ЯA-Z0-9-]/g, '');
      setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!birthDate) {
      alert("Пожалуйста, укажите дату рождения");
      return;
    }
    
    // Validate token format if present
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
        birthDate: birthDate.toISOString()
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
              <DatePicker
                selected={birthDate}
                onChange={(date) => setBirthDate(date)}
                dateFormat="dd.MM.yyyy"
                locale={ru}
                showYearDropdown
                dropdownMode="select"
                className="input-field"
                placeholderText="ДД.ММ.ГГГГ"
                required
              />
            </div>
          </div>
          
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Личный номер (Жетон)</label>
              <input type="text" name="tokenNumber" className="input-field" placeholder="АВ-123456" value={formData.tokenNumber} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label className="input-label">№ Истории Болезни</label>
              <input type="text" name="caseHistoryNumber" className="input-field" value={formData.caseHistoryNumber} onChange={handleChange} />
            </div>
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Воинское звание</label>
              <input type="text" name="rank" className="input-field" placeholder="Например: Рядовой" value={formData.rank} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label className="input-label">Номер в/ч</label>
              <input type="text" name="militaryUnit" className="input-field" value={formData.militaryUnit} onChange={handleChange} />
            </div>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
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
