// api.js - Simple fetch wrapper for API
const API_URL = 'http://localhost:8080/api';

export const api = {
  getPatients: async () => {
    const res = await fetch(`${API_URL}/patients`);
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  },
  
  getPatient: async (id) => {
    const res = await fetch(`${API_URL}/patients/${id}`);
    if (!res.ok) throw new Error('Failed to fetch patient');
    return res.json();
  },
  
  createPatient: async (data) => {
    const res = await fetch(`${API_URL}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create patient');
    return res.json();
  },
  
  updatePatient: async (id, data) => {
    const res = await fetch(`${API_URL}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update patient');
    return res.json();
  },
  
  transferPatient: async (id, toDepartment) => {
    const res = await fetch(`${API_URL}/patients/${id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toDepartment })
    });
    if (!res.ok) throw new Error('Failed to transfer patient');
    return res.json();
  },
  
  deletePatient: async (id) => {
    const res = await fetch(`${API_URL}/patients/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete patient');
  },
  
  uploadDocument: async (patientId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_URL}/patients/${patientId}/documents`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },
  
  deleteDocument: async (id) => {
    const res = await fetch(`${API_URL}/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
  },
  
  exportPatientsUrl: `${API_URL}/export/patients`,
  getDocumentUrl: (id) => `${API_URL}/documents/${id}`
};
