import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mantenemos la validación temporal que pediste antes
    if (email !== 'mitron' || password !== '12345') {
      alert('Credenciales incorrectas');
      setIsLoading(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      login();
      setIsLoading(false);
      navigate('/dashboard', { replace: true });
    }, 1000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #1C2D54, #4B6082)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '48px 40px',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <img 
            src="/logo.png" 
            alt="Electrónica Mitron Audiovisión" 
            style={{ height: '80px', objectFit: 'contain', marginBottom: '24px' }} 
          />
          <h1 style={{ color: '#0F172A', fontSize: '26px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            Iniciar sesión
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0, textAlign: 'center' }}>
            Accede a Sistema Mitron.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: '#475569', fontSize: '13px', fontWeight: 700 }}>
              Correo
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ulises@mitron.mx"
              style={{
                width: '100%', padding: '12px 14px', backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0', borderRadius: '8px', color: '#0F172A',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: '#475569', fontSize: '13px', fontWeight: 700 }}>
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="........."
              style={{
                width: '100%', padding: '12px 14px', backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0', borderRadius: '8px', color: '#0F172A',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box', letterSpacing: '2px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '12px', width: '100%', padding: '14px', backgroundColor: '#0F172A',
              color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isLoading ? 'wait' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? (
              <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              'Iniciar sesión'
            )}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <a href="#" style={{ color: '#334155', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </form>
      </div>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          input:focus {
            border-color: #94A3B8 !important;
            box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1);
          }
          button:hover:not(:disabled) {
            background-color: #1E293B !important;
          }
        `}
      </style>
    </div>
  );
}
