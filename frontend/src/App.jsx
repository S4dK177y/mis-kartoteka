import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Users, Activity } from 'lucide-react';
import PatientList from './pages/PatientList';
import PatientProfile from './pages/PatientProfile';
import PatientForm from './pages/PatientForm';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <Link to="/" className="app-title">
            <div className="app-title-icon">
              <Activity size={28} />
            </div>
            <span>МедКартотека</span>
          </Link>
          
          <nav>
            <Link to="/patients/new" className="btn btn-primary">
              <Users size={18} />
              Новый пациент
            </Link>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<PatientList />} />
            <Route path="/patients/new" element={<PatientForm />} />
            <Route path="/patients/:id" element={<PatientProfile />} />
            <Route path="/patients/:id/edit" element={<PatientForm />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
