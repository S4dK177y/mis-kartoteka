import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Upload, File as FileIcon, ExternalLink } from 'lucide-react';
import { api } from '../api';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
      await fetchPatient(); // Refresh data to show new document
    } catch (error) {
      alert('Ошибка при загрузке файла');
    } finally {
      setUploading(false);
      e.target.value = null; // reset input
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

  if (loading || !patient) return <div className="p-6 text-center text-muted">Загрузка...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button className="btn btn-icon btn-outline" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl" style={{ margin: 0 }}>Карта пациента</h2>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-outline" onClick={() => navigate(`/patients/${id}/edit`)}>
            <Edit2 size={18} /> Редактировать
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={18} /> Удалить
          </button>
        </div>
      </div>

      <div className="grid-2">
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
              <span className="text-muted">Статус:</span>
              <span className={`badge ${patient.status === 'Активен' ? 'badge-active' : 'badge-archived'}`}>
                {patient.status}
              </span>
            </div>
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
