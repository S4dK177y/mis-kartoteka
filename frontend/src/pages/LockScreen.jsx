import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Lock, ShieldCheck, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LockScreen() {
  const { setupEncryption, unlock } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const data = await api.checkSystemStatus();
      setStatus(data);
      if (data.isUnlocked) {
        window.location.href = '/'; // Already unlocked
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (status && !status.encryptionInitialized) {
      if (password !== confirmPassword) {
        setError('Пароли не совпадают!');
        return;
      }
    }

    setLoading(true);

    try {
      if (status && !status.encryptionInitialized) {
        await setupEncryption(password);
      } else {
        await unlock(password);
      }
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="auth-background" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="auth-background" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-fade-in" style={{ 
        maxWidth: '420px', 
        width: '90%', 
        background: 'rgba(15, 23, 42, 0.75)', 
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.15)', 
        boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6)',
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Glow effect at top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, transparent, #3b82f6, #10b981, transparent)', opacity: 0.8 }} />
        
        <div style={{ padding: '2.5rem' }}>
          <div className="flex-col items-center gap-4 text-center mb-8">
            <div style={{ 
              background: status.encryptionInitialized ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
              width: '4rem',
              height: '4rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '50%', 
              boxShadow: status.encryptionInitialized ? '0 0 30px rgba(239, 68, 68, 0.2)' : '0 0 30px rgba(59, 130, 246, 0.2)',
              border: `1px solid ${status.encryptionInitialized ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
            }}>
              {status.encryptionInitialized ? <Lock size={32} color="#ef4444" /> : <ShieldCheck size={32} color="#3b82f6" />}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <h2 className="text-2xl font-bold m-0 mb-2" style={{ color: 'white', letterSpacing: '-0.02em' }}>
                {status.encryptionInitialized ? 'Система защищена' : 'Инициализация защиты'}
              </h2>
              <p className="text-sm m-0" style={{ color: '#94a3b8', lineHeight: 1.6 }}>
                {status.encryptionInitialized 
                  ? 'База данных зашифрована по ГОСТ Р 34.12-2018. Введите Мастер-пароль для расшифровки и продолжения работы.' 
                  : 'Защитите систему, создав надежный Мастер-пароль. Он будет использоваться для шифрования всех медицинских данных.'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 text-sm animate-fade-in" style={{ 
              background: 'rgba(127, 29, 29, 0.3)', 
              color: '#fca5a5', 
              borderRadius: '12px', 
              border: '1px solid rgba(220, 38, 38, 0.4)',
              textAlign: 'center',
              backdropFilter: 'blur(4px)'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-col gap-5">
            <div className="input-group mb-0">
              <label className="text-sm font-semibold mb-2 block" style={{ color: '#cbd5e1', letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                Мастер-пароль
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input 
                  type="password" 
                  autoComplete="new-password"
                  className="input-field" 
                  style={{ 
                    padding: '14px 14px 14px 44px', 
                    background: 'rgba(15, 23, 42, 0.6)', 
                    borderColor: 'rgba(255, 255, 255, 0.1)', 
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = 'rgba(15, 23, 42, 0.8)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.background = 'rgba(15, 23, 42, 0.6)'; }}
                  required 
                  autoFocus
                  placeholder={status.encryptionInitialized ? "••••••••••••" : "Придумайте пароль"}
                />
              </div>
            </div>

            {!status.encryptionInitialized && (
              <div className="input-group mb-0">
                <label className="text-sm font-semibold mb-2 block" style={{ color: '#cbd5e1', letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  Повторите пароль
                </label>
                <div style={{ position: 'relative' }}>
                  <Key size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="password" 
                    autoComplete="new-password"
                    className="input-field" 
                    style={{ 
                      padding: '14px 14px 14px 44px', 
                      background: 'rgba(15, 23, 42, 0.6)', 
                      borderColor: 'rgba(255, 255, 255, 0.1)', 
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = 'rgba(15, 23, 42, 0.8)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.background = 'rgba(15, 23, 42, 0.6)'; }}
                    required 
                    placeholder="Повторите придуманный пароль"
                  />
                </div>
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary w-full justify-center mt-2" 
              disabled={loading} 
              style={{ 
                padding: '14px', 
                fontWeight: 600, 
                borderRadius: '12px',
                fontSize: '1rem',
                letterSpacing: '0.01em',
                background: status.encryptionInitialized ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: status.encryptionInitialized ? '0 8px 20px -6px rgba(59, 130, 246, 0.6)' : '0 8px 20px -6px rgba(16, 185, 129, 0.6)',
                border: 'none',
                color: 'white',
                transform: 'translateY(0)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {loading ? 'Секунду...' : (status.encryptionInitialized ? 'Разблокировать систему' : 'Зашифровать данные')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
