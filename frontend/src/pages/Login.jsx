import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogIn } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Ошибка авторизации. Проверьте логин и пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-background">
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2rem', background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '24px' }}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-4" style={{ width: '64px', height: '64px', background: 'var(--primary)', color: 'white', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.5)' }}>
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--text)' }}>Вход в МИС</h1>
          <p className="text-muted mt-2 text-sm">Пожалуйста, авторизуйтесь для доступа к системе</p>
        </div>

        {error && (
          <div className="bg-danger text-white p-3 rounded-md mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="input-group">
            <label className="input-label">Логин</label>
            <input 
              type="text" 
              className="input-field" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              placeholder="Имя пользователя"
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
          <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? 'Вход...' : <><LogIn size={18} /> Войти</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
