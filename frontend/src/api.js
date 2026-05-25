// api.js - Simple fetch wrapper for API
// Use relative path so it works from any IP on the network (fallback to localhost for dev)
const API_URL = import.meta.env.DEV ? 'http://localhost:8080/api' : '/api';

const fetchWithAuth = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    credentials: 'include' // Always send HTTP-only cookies
  });

  if (res.status === 401) {
    // Unauthorized - token missing or expired
    if (window.location.pathname !== '/login' && window.location.pathname !== '/setup') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (res.status === 423) {
    // Locked - Master password required
    if (window.location.pathname !== '/locked') {
      window.location.href = '/locked';
    }
    throw new Error('System is locked');
  }

  return res;
};

export const api = {
  // --- AUTH ---
  checkSystemStatus: async () => {
    const res = await fetchWithAuth(`${API_URL}/system/status`);
    if (!res.ok) throw new Error('Failed to check status');
    return res.json();
  },
  
  setupSystem: async (username, password) => {
    const res = await fetchWithAuth(`${API_URL}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Setup failed');
    return res.json();
  },

  // --- ENCRYPTION ---
  unlockSystem: async (password) => {
    const res = await fetchWithAuth(`${API_URL}/system/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error('Неверный Мастер-пароль');
    return res.json();
  },

  lockSystem: async () => {
    const res = await fetchWithAuth(`${API_URL}/system/lock`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to lock system');
    return res.json();
  },

  changeMasterPassword: async (oldPassword, newPassword) => {
    const res = await fetchWithAuth(`${API_URL}/system/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to change master password');
    }
    return res.json();
  },

  setupEncryption: async (password) => {
    const res = await fetchWithAuth(`${API_URL}/system/setup-encryption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error('Ошибка при установке пароля');
    return res.json();
  },

  login: async (username, password) => {
    const res = await fetchWithAuth(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Invalid credentials');
    return res.json();
  },

  logout: async () => {
    await fetchWithAuth(`${API_URL}/auth/logout`, { method: 'POST' });
  },

  getCurrentUser: async () => {
    const res = await fetchWithAuth(`${API_URL}/auth/me`);
    if (!res.ok) throw new Error('Not logged in');
    return res.json();
  },

  // --- ADMIN ---
  getUsers: async () => {
    const res = await fetchWithAuth(`${API_URL}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  createUser: async (username, password, role) => {
    const res = await fetchWithAuth(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  },

  updateUserRole: async (userId, role) => {
    const res = await fetchWithAuth(`${API_URL}/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!res.ok) throw new Error('Failed to update role');
    return res.json();
  },

  getLogs: async () => {
    const res = await fetchWithAuth(`${API_URL}/logs`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  },

  getLogStats: async () => {
    const res = await fetchWithAuth(`${API_URL}/logs/stats`);
    if (!res.ok) throw new Error('Failed to fetch log stats');
    return res.json();
  },

  getSettings: async () => {
    const res = await fetchWithAuth(`${API_URL}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  updateSettings: async (settings) => {
    const res = await fetchWithAuth(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  migrateEncryption: async () => {
    const res = await fetchWithAuth(`${API_URL}/migrate-encryption`, { method: 'POST' });
    if (!res.ok) throw new Error('Migration failed');
    return res.json();
  },

  // --- PATIENTS ---
  getPatients: async () => {
    const res = await fetchWithAuth(`${API_URL}/patients`);
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  },
  
  getPatient: async (id) => {
    const res = await fetchWithAuth(`${API_URL}/patients/${id}`);
    if (!res.ok) throw new Error('Failed to fetch patient');
    return res.json();
  },
  
  createPatient: async (data) => {
    const res = await fetchWithAuth(`${API_URL}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create patient');
    return res.json();
  },
  
  updatePatient: async (id, data) => {
    const res = await fetchWithAuth(`${API_URL}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update patient');
    return res.json();
  },
  
  transferPatient: async (id, toDepartment, transferDate) => {
    const res = await fetchWithAuth(`${API_URL}/patients/${id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toDepartment, transferDate })
    });
    if (!res.ok) throw new Error('Failed to transfer patient');
    return res.json();
  },
  
  deletePatient: async (id) => {
    const res = await fetchWithAuth(`${API_URL}/patients/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete patient');
  },
  
  // --- DOCUMENTS ---
  uploadDocument: async (patientId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetchWithAuth(`${API_URL}/patients/${patientId}/documents`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },

  uploadConsultationDocument: async (consultationId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetchWithAuth(`${API_URL}/consultations/${consultationId}/documents`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },

  uploadConsultationVvkDocument: async (consultationId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetchWithAuth(`${API_URL}/consultations/${consultationId}/vvk-document`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload VVK document');
    }
    return res.json();
  },
  
  deleteDocument: async (id) => {
    const res = await fetchWithAuth(`${API_URL}/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
  },
  
  // --- CONSULTATIONS ---
  getConsultations: async () => {
    const res = await fetchWithAuth(`${API_URL}/consultations`);
    if (!res.ok) throw new Error('Failed to fetch consultations');
    return res.json();
  },

  getConsultation: async (id) => {
    const res = await fetchWithAuth(`${API_URL}/consultations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch consultation');
    return res.json();
  },

  createConsultation: async (data) => {
    const res = await fetchWithAuth(`${API_URL}/consultations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create consultation');
    return res.json();
  },

  updateConsultation: async (id, data) => {
    const res = await fetchWithAuth(`${API_URL}/consultations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update consultation');
    return res.json();
  },

  deleteConsultation: async (id) => {
    const res = await fetchWithAuth(`${API_URL}/consultations/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete consultation');
  },

  // --- PERSONS ---
  getPersons: async () => {
    const res = await fetchWithAuth(`${API_URL}/persons`);
    if (!res.ok) throw new Error('Failed to fetch persons');
    return res.json();
  },
  getPersonProfile: async (id) => {
    const res = await fetchWithAuth(`${API_URL}/persons/${id}`);
    if (!res.ok) throw new Error('Failed to fetch person profile');
    return res.json();
  },

  exportPatientsUrl: `${API_URL}/export/patients`,
  getDocumentUrl: (id) => `${API_URL}/documents/${id}`
};
