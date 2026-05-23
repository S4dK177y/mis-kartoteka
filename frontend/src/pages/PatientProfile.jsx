import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Upload, File as FileIcon, ExternalLink, RefreshCw, LogOut, FileText } from 'lucide-react';
import { api } from '../api';
import { DEPARTMENTS } from './PatientForm';

const formatDateTimeLocal = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  return (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
};

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
    date: formatDateTimeLocal(new Date().toISOString())
  });
  const [dischargeData, setDischargeData] = useState({
    date: formatDateTimeLocal(new Date().toISOString()),
    destination: ''
  });

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      const data = await api.getPatient(id);
      setPatient(data);
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
      await api.transferPatient(id, transferData.department, new Date(transferData.date).toISOString());
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
        dischargeDate: new Date(dischargeData.date).toISOString(),
        dischargeDestination: dischargeData.destination
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
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button className="btn btn-icon btn-outline" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl m-0">{patient.fullName}</h2>
            <div className="text-muted mt-1 text-sm flex gap-3">
              {patient.tokenNumber && <span>Жетон: {patient.tokenNumber}</span>}
              {patient.caseHistoryNumber && <span>№ ИБ: {patient.caseHistoryNumber}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {patient.status === 'На лечении' && (
            <>
              <button className="btn btn-outline" style={{ color: 'var(--primary-hover)', borderColor: 'var(--primary-light)' }} onClick={() => setShowTransfer(!showTransfer)}>
                <RefreshCw size={18} /> Перевести
              </button>
              <button className="btn btn-outline" style={{ color: 'var(--secondary-hover)', borderColor: 'var(--secondary-light)' }} onClick={() => setShowDischarge(!showDischarge)}>
                <LogOut size={18} /> Выписать
              </button>
            </>
          )}
          <button className="btn btn-outline" onClick={() => navigate(`/patients/${id}/edit`)}>
            <Edit2 size={18} /> Изменить
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={18} /> Удалить
          </button>
        </div>
      </div>

      {showTransfer && (
        <div className="card p-6 mb-6 animate-fade-in" style={{ border: '2px solid var(--primary-light)' }}>
          <h3 className="text-xl mb-4">Оформление перевода</h3>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Отделение перевода</label>
              <select className="input-field" value={transferData.department} onChange={e => setTransferData({...transferData, department: e.target.value})}>
                {DEPARTMENTS.map(dep => <option key={dep} value={dep} disabled={dep === patient.department}>{dep}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Время перевода</label>
              <input type="datetime-local" className="input-field" value={transferData.date} onChange={e => setTransferData({...transferData, date: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-outline" onClick={() => setShowTransfer(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={handleTransfer}>Сохранить перевод</button>
          </div>
        </div>
      )}

      {showDischarge && (
        <div className="card p-6 mb-6 animate-fade-in" style={{ border: '2px solid var(--secondary-light)' }}>
          <h3 className="text-xl mb-4">Оформление выписки</h3>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Время выписки</label>
              <input type="datetime-local" className="input-field" value={dischargeData.date} onChange={e => setDischargeData({...dischargeData, date: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Куда выписывается / переводится</label>
              <input type="text" className="input-field" placeholder="Домой с улучшением" value={dischargeData.destination} onChange={e => setDischargeData({...dischargeData, destination: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-outline" onClick={() => setShowDischarge(false)}>Отмена</button>
            <button className="btn btn-secondary" onClick={handleDischarge}>Сохранить выписку</button>
          </div>
        </div>
      )}

      <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        
        {/* Left Column: Details */}
        <div className="flex-col gap-6" style={{ gridColumn: 'span 1' }}>
          <div className="card p-6">
            <h3 className="text-xl mb-4 text-primary">Данные пациента</h3>
            
            <div className="flex-col gap-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted">Дата рождения:</span>
                <span style={{ fontWeight: 500 }}>{new Date(patient.birthDate).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted">Текущее отделение:</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-hover)' }}>{patient.department}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted">Статус:</span>
                <span className={`badge ${patient.status === 'На лечении' ? 'badge-active' : 'badge-archived'}`}>
                  {patient.status}
                </span>
              </div>
              <div className="flex-col pb-2 border-b">
                <span className="text-muted mb-1">Поступил:</span>
                <span style={{ fontWeight: 500 }}>
                  {new Date(patient.admissionDate).toLocaleDateString('ru-RU')} в {new Date(patient.admissionDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              
              {patient.status === 'Выписан' && (
                <div className="flex-col pb-2 border-b" style={{ background: 'var(--secondary-light)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <span className="text-muted mb-1">Выписан:</span>
                  <span style={{ fontWeight: 600, color: 'var(--secondary-hover)' }}>
                    {patient.dischargeDate ? `${new Date(patient.dischargeDate).toLocaleDateString('ru-RU')} в ${new Date(patient.dischargeDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}` : '—'}
                  </span>
                  <span className="mt-1">{patient.dischargeDestination || 'Исход не указан'}</span>
                </div>
              )}

              <div className="flex-col mt-2">
                <span className="text-muted mb-1">Адрес проживания:</span>
                <p>{patient.address || 'Не указан'}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-xl mb-4 text-primary">История перемещений</h3>
            <div className="timeline mt-4">
              {patient.transfers && patient.transfers.length > 0 ? (
                // Sort transfers ascending for timeline display (oldest first, newest last)
                [...patient.transfers].reverse().map((t, idx) => (
                  <div key={t.id} className="timeline-item">
                    <div className="text-sm font-semibold">{t.toDepartment}</div>
                    <div className="text-xs text-muted mt-1">
                      {new Date(t.transferDate).toLocaleDateString('ru-RU')} в {new Date(t.transferDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    {idx === 0 && <div className="text-xs text-muted mt-1">(Первичное поступление)</div>}
                  </div>
                ))
              ) : (
                <p className="text-muted text-sm text-center">Нет истории</p>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Diagnoses */}
        <div className="card p-6" style={{ gridColumn: 'span 1' }}>
          <h3 className="text-xl mb-4 text-primary">Клиническая картина</h3>
          
          <div className="flex-col gap-6">
            <div className="p-4" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <div className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Диагноз при поступлении</div>
              <p style={{ fontSize: '0.95rem' }}>{patient.admissionDiagnosis || 'Не установлен'}</p>
            </div>
            
            <div className="p-4" style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
              <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Клинический диагноз</div>
              <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>{patient.clinicalDiagnosis || 'В процессе установки...'}</p>
            </div>
            
            <div className="p-4" style={{ background: patient.status === 'Выписан' ? 'var(--secondary-light)' : 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <div className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Заключительный диагноз</div>
              <p style={{ fontSize: '0.95rem' }}>{patient.finalDiagnosis || 'Не вынесен'}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Files */}
        <div className="card flex-col" style={{ gridColumn: 'span 1', maxHeight: '800px' }}>
          <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl m-0 text-primary">Документы</h3>
              <div>
                <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading}/>
                <label htmlFor="file-upload" className="btn btn-outline btn-icon" style={{ cursor: 'pointer' }} title="Загрузить файл">
                  <Upload size={18} />
                </label>
              </div>
            </div>
          </div>

          <div className="p-4 flex-col gap-2" style={{ flex: 1, overflowY: 'auto' }}>
            {patient.documents.length === 0 ? (
              <div className="text-center text-muted p-6">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Нет загруженных файлов</p>
              </div>
            ) : (
              patient.documents.map(doc => (
                <div key={doc.id} className="flex justify-between items-center p-3" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div className="flex items-center gap-3" style={{ overflow: 'hidden' }}>
                    <FileIcon size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <div className="flex-col" style={{ overflow: 'hidden' }}>
                      <a href={api.getDocumentUrl(doc.id)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {doc.originalName}
                      </a>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(doc.createdAt).toLocaleDateString('ru-RU')} • {(doc.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <button className="btn btn-icon" style={{ color: 'var(--danger)', background: 'transparent', padding: '0.25rem' }} onClick={() => handleDeleteDocument(doc.id)}>
                    <Trash2 size={16} />
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
