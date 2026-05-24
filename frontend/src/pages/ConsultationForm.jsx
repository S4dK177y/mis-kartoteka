import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../api';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ru } from 'date-fns/locale';
import ICD10Autocomplete from '../components/ICD10Autocomplete';
import { MILITARY_RANKS_GROUPS } from '../ranks';

export default function ConsultationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = Boolean(id);
  const prefillData = location.state?.prefillData || null;
  
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
    relativeContact: prefillData?.relativeContact || '',
    diagnosis: '',
    notes: ''
  });
  
  const [consultationDate, setConsultationDate] = useState(new Date());
  const [nextConsultationDate, setNextConsultationDate] = useState(null);
  const [birthDate, setBirthDate] = useState(prefillData?.birthDate ? new Date(prefillData.birthDate) : null);

  const [loading, setLoading] = useState(isEditing);

  const isOtherRank = ['Пенсионер МО РФ', 'Член семьи военнослужащего', 'Другие'].includes(formData.rank);

  useEffect(() => {
    if (isEditing) {
      fetchConsultation();
    }
  }, [id]);

  const fetchConsultation = async () => {
    try {
      // Find the specific consultation by id
      const dataList = await api.getConsultations();
      const data = dataList.find(c => c.id === id);
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
        relativeContact: data.relativeContact || '',
        diagnosis: data.diagnosis || '',
        notes: data.notes || ''
      });
      setConsultationDate(new Date(data.consultationDate));
      
      const bd = new Date(data.birthDate);
      setBirthDate(isNaN(bd.getTime()) ? null : bd);

      if (data.nextConsultationDate) {
        setNextConsultationDate(new Date(data.nextConsultationDate));
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

    setFormData(prev => ({ ...prev, [name]: value }));
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
        nextConsultationDate: nextConsultationDate ? nextConsultationDate.toISOString() : null
      };

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

  if (loading) return <div className="p-6 text-center text-muted">Загрузка...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
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
            <div className="input-group">
              <label className="input-label">Адрес проживания</label>
              <input type="text" name="address" className="input-field" value={formData.address} onChange={handleChange} />
            </div>
          </div>
          
          <div className="grid-2 mt-2">
            <div className="input-group">
              <label className="input-label">Номер телефона</label>
              <input type="text" name="phoneNumber" className="input-field" value={formData.phoneNumber} onChange={handleChange} placeholder="+7 (___) ___-__-__" />
            </div>
            <div className="input-group">
              <label className="input-label">Контактные данные близких</label>
              <input type="text" name="relativeContact" className="input-field" value={formData.relativeContact} onChange={handleChange} placeholder="Жена: +7..." />
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
