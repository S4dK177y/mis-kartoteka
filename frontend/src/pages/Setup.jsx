import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck } from 'lucide-react';

const Setup = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      return setError('Пароли не совпадают');
    }

    if (password.length < 6) {
      return setError('Пароль должен быть не менее 6 символов');
    }

    setLoading(true);
    try {
      await setup(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Ошибка настройки системы.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-background">
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '3rem 2.5rem', background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '24px' }}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-4" style={{ width: '64px', height: '64px', background: 'var(--primary)', color: 'white', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.5)' }}>
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold m-0 text-primary">Первый запуск</h1>
          <p className="text-muted mt-2 text-sm">Создайте учетную запись Администратора для начала работы</p>
        </div>

        {error && (
          <div className="bg-danger text-white p-3 rounded-md mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="input-group">
            <label className="input-label">Логин администратора</label>
            <input 
              type="text" 
              className="input-field" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Пароль</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>
          <div className="input-group">
            <label className="input-label">Подтвердите пароль</label>
            <input 
              type="password" 
              className="input-field" 
              value={passwordConfirm} 
              onChange={e => setPasswordConfirm(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? 'Создание...' : <><ShieldCheck size={18} /> Завершить настройку</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Setup;
