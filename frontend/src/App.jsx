import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Activity, Plus } from 'lucide-react';
import PatientList from './pages/PatientList';
import PatientForm from './pages/PatientForm';
import PatientProfile from './pages/PatientProfile';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="header">
          <Link to="/" className="header-logo">
            <div style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '10px', display: 'flex' }}>
              <Activity size={24} />
            </div>
            МедКартотека
          </Link>
          <Link to="/patients/new" className="btn btn-primary">
            <Plus size={18} />
            Новый пациент
          </Link>
        </header>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<PatientList />} />
            <Route path="/patients/new" element={<PatientForm />} />
            <Route path="/patients/:id" element={<PatientProfile />} />
            <Route path="/patients/:id/edit" element={<PatientForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
