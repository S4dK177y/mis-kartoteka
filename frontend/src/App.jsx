import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Plus, Settings, LogOut, Download } from 'lucide-react';
import { api } from './api';
import PatientList from './pages/PatientList';
import PatientForm from './pages/PatientForm';
import PatientProfile from './pages/PatientProfile';
import ConsultationList from './pages/ConsultationList';
import ConsultationForm from './pages/ConsultationForm';
import PersonList from './pages/PersonList';
import PersonProfile from './pages/PersonProfile';
import Login from './pages/Login';
import Setup from './pages/Setup';
import AdminPanel from './pages/AdminPanel';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (location.pathname === '/login' || location.pathname === '/setup') {
    return null; // Hide header on auth pages
  }

  return (
    <header className="header">
      <div className="flex items-center gap-6 flex-wrap">
        <Link to="/" className="header-logo">
          <div style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '10px', display: 'flex' }}>
            <Activity size={24} />
          </div>
          МИС Картотека
        </Link>
        <nav className="header-nav flex gap-4 flex-wrap" style={{ marginLeft: '1rem' }}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Стационар</Link>
          <Link to="/consultations" className={`nav-link ${location.pathname.startsWith('/consultations') ? 'active' : ''}`}>Амбулатория</Link>
          <Link to="/persons" className={`nav-link ${location.pathname.startsWith('/persons') ? 'active' : ''}`}>Все пациенты</Link>
        </nav>
      </div>
      
      <div className="flex gap-4 items-center flex-wrap">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href={api.exportPatientsUrl} className="btn btn-outline" download title="Экспорт в Excel (Стационар и Амбулатория)">
            <Download size={18} /> Экспорт
          </a>
          <Link to="/patients/new" className="btn btn-primary" title="Новая госпитализация">
            <Plus size={18} />
            Госпитализация
          </Link>
          <Link to="/consultations/new" className="btn btn-secondary" title="Новая консультация">
            <Plus size={18} />
            Консультация
          </Link>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', borderLeft: '1px solid var(--border)', paddingLeft: '1rem', marginLeft: '0.5rem' }}>
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="btn btn-outline" style={{ border: 'none' }} title="Настройки системы">
              <Settings size={18} />
            </Link>
          )}
          {user && (
            <button onClick={logout} className="btn btn-outline" style={{ border: 'none', color: 'var(--text-muted)' }} title="Выйти">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

const AppRoutes = () => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Setup />} />
          
          <Route path="/" element={<ProtectedRoute><PatientList /></ProtectedRoute>} />
          <Route path="/consultations" element={<ProtectedRoute><ConsultationList /></ProtectedRoute>} />
          <Route path="/persons" element={<ProtectedRoute><PersonList /></ProtectedRoute>} />
          <Route path="/persons/:id" element={<ProtectedRoute><PersonProfile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminPanel /></ProtectedRoute>} />
          
          <Route path="/patients/new" element={<ProtectedRoute><PatientForm /></ProtectedRoute>} />
          <Route path="/patients/:id" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />
          <Route path="/patients/:id/edit" element={<ProtectedRoute><PatientForm /></ProtectedRoute>} />
          
          <Route path="/consultations/new" element={<ProtectedRoute><ConsultationForm /></ProtectedRoute>} />
          <Route path="/consultations/:id/edit" element={<ProtectedRoute><ConsultationForm /></ProtectedRoute>} />
          
          <Route path="*" element={<ProtectedRoute><PatientList /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
