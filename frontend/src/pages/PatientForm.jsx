import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { Save, ArrowLeft } from 'lucide-react';

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
    fullName: '',
    birthDate: '',
    address: '',
    diagnosis: '',
    department: DEPARTMENTS[0],
    admissionDate: new Date().toISOString().split('T')[0],
    status: 'На лечении'
  });
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
        fullName: data.fullName,
        birthDate: data.birthDate.split('T')[0],
        address: data.address || '',
        diagnosis: data.diagnosis || '',
        department: data.department || DEPARTMENTS[0],
        admissionDate: data.admissionDate ? data.admissionDate.split('T')[0] : new Date().toISOString().split('T')[0],
        status: data.status
      });
    } catch (error) {
      console.error(error);
      alert('Ошибка при загрузке данных пациента');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.updatePatient(id, formData);
        navigate(`/patients/${id}`);
      } else {
        const newPatient = await api.createPatient(formData);
        navigate(`/patients/${newPatient.id}`);
      }
    } catch (error) {
      console.error(error);
      alert('Ошибка при сохранении');
    }
  };

  if (loading) return <div className="p-6 text-center text-muted">Загрузка...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-icon btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl">{isEditing ? 'Редактирование пациента' : 'Новая запись пациента'}</h2>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">ФИО (Полностью) *</label>
              <input 
                type="text" 
                name="fullName"
                className="input-field" 
                required 
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Дата рождения *</label>
              <input 
                type="date" 
                name="birthDate"
                className="input-field" 
                required 
                value={formData.birthDate}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Личный номер (Жетон)</label>
              <input 
                type="text" 
                name="tokenNumber"
                className="input-field" 
                value={formData.tokenNumber}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Дата поступления *</label>
              <input 
                type="date" 
                name="admissionDate"
                className="input-field" 
                required 
                value={formData.admissionDate}
                onChange={handleChange}
              />
            </div>
          </div>
          
          {!isEditing && (
             <div className="input-group">
               <label className="input-label">Отделение (при поступлении) *</label>
               <select 
                 name="department" 
                 className="input-field" 
                 value={formData.department}
                 onChange={handleChange}
               >
                 {DEPARTMENTS.map(dep => (
                   <option key={dep} value={dep}>{dep}</option>
                 ))}
               </select>
             </div>
          )}

          <div className="input-group">
            <label className="input-label">Адрес проживания</label>
            <input 
              type="text" 
              name="address"
              className="input-field" 
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Диагноз (Основной)</label>
            <textarea 
              name="diagnosis"
              className="input-field" 
              rows={3}
              value={formData.diagnosis}
              onChange={handleChange}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Отмена</button>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
