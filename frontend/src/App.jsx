import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Plus, Settings, LogOut } from 'lucide-react';
import PatientList from './pages/PatientList';
import PatientForm from './pages/PatientForm';
import PatientProfile from './pages/PatientProfile';
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
      <Link to="/" className="header-logo">
        <div style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '10px', display: 'flex' }}>
          <Activity size={24} />
        </div>
        МИС Картотека
      </Link>
      
      <div className="flex gap-4 items-center">
        {user?.role === 'ADMIN' && (
          <Link to="/admin" className="btn btn-outline" style={{ border: 'none' }} title="Настройки системы">
            <Settings size={18} />
          </Link>
        )}
        <Link to="/patients/new" className="btn btn-primary">
          <Plus size={18} />
          Новый пациент
        </Link>
        {user && (
          <button onClick={logout} className="btn btn-outline" style={{ border: 'none', color: 'var(--text-muted)' }} title="Выйти">
            <LogOut size={18} />
          </button>
        )}
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
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminPanel /></ProtectedRoute>} />
          <Route path="/patients/new" element={<ProtectedRoute><PatientForm /></ProtectedRoute>} />
          <Route path="/patients/:id" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />
          <Route path="/patients/:id/edit" element={<ProtectedRoute><PatientForm /></ProtectedRoute>} />
          
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
