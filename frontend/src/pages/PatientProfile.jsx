import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Upload, File as FileIcon, ExternalLink, RefreshCw, LogOut } from 'lucide-react';
import { api } from '../api';
import { DEPARTMENTS } from './PatientForm';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Modal states
  const [showTransfer, setShowTransfer] = useState(false);
  const [showDischarge, setShowDischarge] = useState(false);
  const [transferDep, setTransferDep] = useState(DEPARTMENTS[0]);
  const [dischargeData, setDischargeData] = useState({
    date: new Date().toISOString().split('T')[0],
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
    if (window.confirm('Вы уверены, что хотите удалить эту карту пациента? Это действие необратимо и удалит все связанные файлы.')) {
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
      await api.transferPatient(id, transferDep);
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
        dischargeDate: dischargeData.date,
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
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button className="btn btn-icon btn-outline" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl" style={{ margin: 0 }}>
            Карта пациента {patient.tokenNumber ? `(№ ${patient.tokenNumber})` : ''}
          </h2>
        </div>
        <div className="flex gap-2">
          {patient.status === 'На лечении' && (
            <>
              <button className="btn btn-outline" style={{ color: 'var(--primary-hover)', borderColor: 'var(--primary-light)' }} onClick={() => setShowTransfer(true)}>
                <RefreshCw size={18} /> Перевести
              </button>
              <button className="btn btn-outline" style={{ color: 'var(--secondary-hover)', borderColor: 'var(--secondary-light)' }} onClick={() => setShowDischarge(true)}>
                <LogOut size={18} /> Выписать
              </button>
            </>
          )}
          <button className="btn btn-outline" onClick={() => navigate(`/patients/${id}/edit`)}>
            <Edit2 size={18} /> Изменить
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {showTransfer && (
        <div className="card p-6 mb-6" style={{ border: '2px solid var(--primary-light)' }}>
          <h3 className="text-xl mb-4">Перевод в другое отделение</h3>
          <div className="flex gap-4 items-end">
            <div className="input-group" style={{ flex: 1, margin: 0 }}>
              <label className="input-label">Новое отделение</label>
              <select className="input-field" value={transferDep} onChange={e => setTransferDep(e.target.value)}>
                {DEPARTMENTS.map(dep => (
                  <option key={dep} value={dep} disabled={dep === patient.department}>{dep}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleTransfer}>Подтвердить перевод</button>
            <button className="btn btn-outline" onClick={() => setShowTransfer(false)}>Отмена</button>
          </div>
        </div>
      )}

      {showDischarge && (
        <div className="card p-6 mb-6" style={{ border: '2px solid var(--secondary-light)' }}>
          <h3 className="text-xl mb-4">Выписка пациента</h3>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Дата выписки</label>
              <input type="date" className="input-field" value={dischargeData.date} onChange={e => setDischargeData({...dischargeData, date: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Куда выписывается / переводится</label>
              <input type="text" className="input-field" placeholder="Например: домой с улучшением" value={dischargeData.destination} onChange={e => setDischargeData({...dischargeData, destination: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn btn-outline" onClick={() => setShowDischarge(false)}>Отмена</button>
            <button className="btn btn-secondary" onClick={handleDischarge}>Оформить выписку</button>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="flex-col gap-6">
          <div className="card p-6">
            <h3 className="text-xl mb-4" style={{ color: 'var(--primary-hover)' }}>{patient.fullName}</h3>
            
            <div className="flex-col gap-4">
              <div className="flex justify-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <span className="text-muted">Дата рождения:</span>
                <span style={{ fontWeight: 500 }}>{new Date(patient.birthDate).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex justify-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                <span className="text-muted">Дата поступления:</span>
                <span>{new Date(patient.admissionDate).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex justify-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                <span className="text-muted">Текущее отделение:</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-hover)' }}>{patient.department}</span>
              </div>
              <div className="flex justify-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                <span className="text-muted">Статус:</span>
                <span className={`badge ${patient.status === 'На лечении' ? 'badge-active' : 'badge-archived'}`}>
                  {patient.status}
                </span>
              </div>
              
              {patient.status === 'Выписан' && (
                <>
                  <div className="flex justify-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span className="text-muted">Дата выписки:</span>
                    <span style={{ fontWeight: 500, color: 'var(--secondary-hover)' }}>
                      {patient.dischargeDate ? new Date(patient.dischargeDate).toLocaleDateString('ru-RU') : '—'}
                    </span>
                  </div>
                  <div className="flex-col" style={{ paddingTop: '0.5rem' }}>
                    <span className="text-muted mb-2">Куда выписан:</span>
                    <p>{patient.dischargeDestination || '—'}</p>
                  </div>
                </>
              )}

              <div className="flex-col" style={{ paddingTop: '0.5rem' }}>
                <span className="text-muted mb-2">Адрес:</span>
                <p>{patient.address || 'Не указан'}</p>
              </div>
              <div className="flex-col mt-4" style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                <span className="text-muted mb-2">Диагноз:</span>
                <p style={{ fontWeight: 500 }}>{patient.diagnosis || 'Не установлен'}</p>
              </div>
            </div>
          </div>

          {/* Transfer History */}
          <div className="card p-6">
            <h3 className="text-xl mb-4">История отделений</h3>
            {patient.transfers && patient.transfers.length > 0 ? (
              <div className="flex-col gap-3">
                {patient.transfers.map((t, idx) => (
                  <div key={t.id} className="flex justify-between items-center p-3" style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                    <div className="flex-col">
                      <span style={{ fontWeight: 500 }}>{t.toDepartment}</span>
                      {t.fromDepartment && <span className="text-muted text-sm">Переведен из: {t.fromDepartment}</span>}
                      {!t.fromDepartment && <span className="text-muted text-sm">Первичное поступление</span>}
                    </div>
                    <div className="text-muted text-sm text-right">
                      {new Date(t.transferDate).toLocaleDateString('ru-RU')}
                      <br/>
                      {new Date(t.transferDate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center p-4">Нет истории переводов</p>
            )}
          </div>
        </div>

        <div className="card flex-col">
          <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl m-0">Документы и Сканы</h3>
              <div>
                <input 
                  type="file" 
                  id="file-upload" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  <Upload size={18} />
                  {uploading ? 'Загрузка...' : 'Загрузить файл'}
                </label>
              </div>
            </div>
            <p className="text-muted text-sm">Поддерживаются любые типы файлов (PDF, JPG, PNG, DOCX и т.д.)</p>
          </div>

          <div className="p-6" style={{ flex: 1, overflowY: 'auto' }}>
            {patient.documents.length === 0 ? (
              <div className="text-center text-muted p-4">Нет загруженных документов</div>
            ) : (
              <div className="flex-col gap-2">
                {patient.documents.map(doc => (
                  <div key={doc.id} className="flex justify-between items-center p-3" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-color)' }}>
                    <div className="flex items-center gap-3" style={{ overflow: 'hidden' }}>
                      <FileIcon size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <div className="flex-col" style={{ overflow: 'hidden' }}>
                        <a href={api.getDocumentUrl(doc.id)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {doc.originalName}
                        </a>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {new Date(doc.createdAt).toLocaleDateString('ru-RU')} • {(doc.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={api.getDocumentUrl(doc.id)} target="_blank" rel="noreferrer" className="btn btn-icon btn-outline">
                        <ExternalLink size={16} />
                      </a>
                      <button className="btn btn-icon btn-outline" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteDocument(doc.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
