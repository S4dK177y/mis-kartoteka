import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Plus, Settings, LogOut, Download, Menu, X, Lock } from 'lucide-react';
import { api } from './api';
import PatientList from './pages/PatientList';
import PatientForm from './pages/PatientForm';
import PatientProfile from './pages/PatientProfile';
import ConsultationList from './pages/ConsultationList';
import ConsultationForm from './pages/ConsultationForm';
import ConsultationProfile from './pages/ConsultationProfile';
import PersonList from './pages/PersonList';
import PersonProfile from './pages/PersonProfile';
import Login from './pages/Login';
import Setup from './pages/Setup';
import LockScreen from './pages/LockScreen';
import AdminPanel from './pages/AdminPanel';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const Header = () => {
  const { user, loading, isLocked, logout, lock } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading || isLocked || location.pathname === '/login' || location.pathname === '/setup' || location.pathname === '/locked') {
    return null; // Hide header during loading, when locked, or on auth pages
  }

  return (
    <header className="header">
      <div className="header-top">
        <Link to="/" className="header-logo" onClick={() => setMobileMenuOpen(false)}>
          <div style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '10px', display: 'flex' }}>
            <Activity size={24} />
          </div>
          МИС Картотека
        </Link>
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`header-content ${mobileMenuOpen ? 'open' : ''}`}>
        <nav className="header-nav flex gap-4" style={{ marginLeft: '1rem' }}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Стационар</Link>
          <Link to="/consultations" className={`nav-link ${location.pathname.startsWith('/consultations') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Амбулатория</Link>
          <Link to="/persons" className={`nav-link ${location.pathname.startsWith('/persons') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Все пациенты</Link>
        </nav>
        
        <div className="header-actions flex gap-4 items-center">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href={api.exportPatientsUrl} className="btn btn-outline" download title="Экспорт в Excel (Стационар и Амбулатория)">
              <Download size={18} /> <span className="hide-on-mobile">Экспорт</span>
            </a>
            <Link to="/patients/new" className="btn btn-primary" title="Новая госпитализация" onClick={() => setMobileMenuOpen(false)}>
              <Plus size={18} />
              <span className="hide-on-mobile">Госпитализация</span>
            </Link>
            <Link to="/consultations/new" className="btn btn-secondary" title="Новая консультация" onClick={() => setMobileMenuOpen(false)}>
              <Plus size={18} />
              <span className="hide-on-mobile">Консультация</span>
            </Link>
          </div>
          
          <div className="header-user-actions" style={{ display: 'flex', gap: '8px', borderLeft: '1px solid var(--border)', paddingLeft: '1rem', marginLeft: '0.5rem' }}>
            {user?.role === 'ADMIN' && (
              <>
                <button onClick={() => { lock(); setMobileMenuOpen(false); }} className="btn btn-outline" style={{ border: 'none', color: 'var(--primary)' }} title="Заблокировать систему">
                  <Lock size={18} />
                </button>
                <Link to="/admin" className="btn btn-outline" style={{ border: 'none' }} title="Настройки системы" onClick={() => setMobileMenuOpen(false)}>
                  <Settings size={18} />
                </Link>
              </>
            )}
            {user && (
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn btn-outline" style={{ border: 'none', color: 'var(--text-muted)' }} title="Выйти">
                <LogOut size={18} />
              </button>
            )}
          </div>
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
          <Route path="/locked" element={<LockScreen />} />
          
          <Route path="/" element={<ProtectedRoute><PatientList /></ProtectedRoute>} />
          <Route path="/consultations" element={<ProtectedRoute><ConsultationList /></ProtectedRoute>} />
          <Route path="/persons" element={<ProtectedRoute><PersonList /></ProtectedRoute>} />
          <Route path="/persons/:id" element={<ProtectedRoute><PersonProfile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminPanel /></ProtectedRoute>} />
          
          <Route path="/patients/new" element={<ProtectedRoute><PatientForm /></ProtectedRoute>} />
          <Route path="/patients/:id" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />
          <Route path="/patients/:id/edit" element={<ProtectedRoute><PatientForm /></ProtectedRoute>} />
          
          <Route path="/consultations/new" element={<ProtectedRoute><ConsultationForm /></ProtectedRoute>} />
          <Route path="/consultations/:id" element={<ProtectedRoute><ConsultationProfile /></ProtectedRoute>} />
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
