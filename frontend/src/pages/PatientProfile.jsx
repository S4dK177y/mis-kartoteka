import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Upload, File as FileIcon, ExternalLink, RefreshCw, LogOut, FileText, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ru } from 'date-fns/locale';
import { api } from '../api';
import { DEPARTMENTS } from './PatientForm';
import ICD10Autocomplete from '../components/ICD10Autocomplete';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
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
      e.target.value = null; 
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

  if (loading || !patient) return <div className="p-6 text-center text-muted">Загрузка...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button className="btn btn-icon btn-outline" onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl m-0">{patient.fullName}</h2>
              {patient.isSvoParticipant && (
                <span className="badge badge-active" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>СВО</span>
              )}
            </div>
            <div className="text-muted text-sm flex gap-3 mt-1 flex-wrap">
              {patient.tokenNumber && <span>Ж: {patient.tokenNumber}</span>}
              {patient.caseHistoryNumber && <span>ИБ: {patient.caseHistoryNumber}</span>}
              {patient.rank && <span>Зв: {patient.rank}</span>}
              {patient.militaryStatus && <span>Статус: {patient.militaryStatus}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {patient.status === 'На лечении' && (
            <>
              <button className="btn btn-outline" style={{ color: 'var(--primary-hover)', borderColor: 'var(--primary-light)' }} onClick={() => { setShowTransfer(!showTransfer); setShowDischarge(false); }}>
                <RefreshCw size={14} /> Перевод в другое отд.
              </button>
              <button className="btn btn-outline" style={{ color: 'var(--secondary-hover)', borderColor: 'var(--secondary-light)' }} onClick={() => { setShowDischarge(!showDischarge); setShowTransfer(false); }}>
                <LogOut size={14} /> Выписка / Перевод
              </button>
            </>
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
                <span className="text-muted">Отделение:</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-hover)' }}>{patient.department}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted">Статус:</span>
                <span className={`badge ${patient.status === 'На лечении' ? 'badge-active' : 'badge-archived'}`}>
                  {patient.status}
                </span>
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
            <div className="flex justify-between items-center">
              <h3 className="text-lg m-0 text-primary">Файлы</h3>
              <div>
                <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading}/>
                <label htmlFor="file-upload" className="btn btn-outline btn-icon" style={{ cursor: 'pointer', padding: '0.3rem' }} title="Загрузить">
                  <Upload size={14} />
                </label>
              </div>
            </div>
          </div>

          <div className="p-3 flex-col gap-2" style={{ flex: 1, overflowY: 'auto' }}>
            {patient.documents.length === 0 ? (
              <div className="text-center text-muted p-4">
                <FileText size={24} className="mx-auto mb-1 opacity-50" />
                <p className="text-xs">Нет файлов</p>
              </div>
            ) : (
              patient.documents.map(doc => (
                <div key={doc.id} className="flex justify-between items-center p-2" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div className="flex items-center gap-2" style={{ overflow: 'hidden' }}>
                    <FileIcon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <div className="flex-col" style={{ overflow: 'hidden' }}>
                      <a href={api.getDocumentUrl(doc.id)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {doc.originalName}
                      </a>
                    </div>
                  </div>
                  <button className="btn btn-icon" style={{ color: 'var(--danger)', background: 'transparent', padding: '0.2rem' }} onClick={() => handleDeleteDocument(doc.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
