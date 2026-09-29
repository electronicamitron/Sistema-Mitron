import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Cpu } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
      backgroundColor: 'var(--mt-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%',
        backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', filter: 'blur(100px)'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%',
        backgroundColor: 'rgba(168, 85, 247, 0.1)', borderRadius: '50%', filter: 'blur(100px)'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--mt-surface)',
        border: '1px solid var(--mt-border)',
        borderRadius: '16px',
        padding: '32px',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', backgroundColor: 'var(--mt-surface-subtle)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px', border: '1px solid var(--mt-border)'
          }}>
            <Cpu size={32} color="var(--mt-text-primary)" />
          </div>
          <h1 style={{ color: 'var(--mt-text-primary)', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            Sistema Mitron
          </h1>
          <p style={{ color: 'var(--mt-text-secondary)', fontSize: '14px', margin: 0, textAlign: 'center' }}>
            Ingresa tus credenciales para acceder al panel
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'var(--mt-text-muted)', fontSize: '13px', fontWeight: 500 }}>
              Usuario
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                <Mail size={18} color="var(--mt-text-secondary)" />
              </div>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mitron"
                style={{
                  width: '100%', padding: '10px 12px 10px 38px', backgroundColor: 'var(--mt-surface-subtle)',
                  border: '1px solid var(--mt-border)', borderRadius: '8px', color: 'var(--mt-text-primary)',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'var(--mt-text-muted)', fontSize: '13px', fontWeight: 500 }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                <Lock size={18} color="var(--mt-text-secondary)" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '10px 12px 10px 38px', backgroundColor: 'var(--mt-surface-subtle)',
                  border: '1px solid var(--mt-border)', borderRadius: '8px', color: 'var(--mt-text-primary)',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--mt-text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" style={{ accentColor: '#3B82F6' }} />
              Recordarme
            </label>
            <a href="#" style={{ color: 'var(--mt-text-primary)', textDecoration: 'none' }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px', width: '100%', padding: '12px', backgroundColor: 'var(--mt-text-primary)',
              color: 'var(--mt-bg)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isLoading ? 'wait' : 'pointer'
            }}
          >
            {isLoading ? (
              <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--mt-bg)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <LogIn size={18} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>
      </div>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          input:focus {
            border-color: var(--mt-text-primary) !important;
          }
        `}
      </style>
    </div>
  );
}
