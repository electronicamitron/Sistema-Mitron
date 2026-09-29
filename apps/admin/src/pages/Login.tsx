import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';
import { Input, Button } from '@mitron/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = (data: LoginFormValues) => {
    setIsLoading(true);

    if (data.email !== 'mitron' || data.password !== '12345') {
      alert('Credenciales incorrectas (Usa mitron / 12345)');
      setIsLoading(false);
      return;
    }
    
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
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif"
    }} className="animate-fade-in">
      
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--mt-surface)',
        borderRadius: '16px',
        padding: '48px 40px',
        border: '1px solid var(--mt-border)',
        boxShadow: 'var(--mt-shadow-hover)',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
          }}>
            <img src="/logo2.png" alt="Electrónica Mitron" style={{ height: '64px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span style="color:#FFF;font-size:28px;font-weight:bold;letter-spacing:2px;">MITRON</span>'; }} />
          </div>
          <h1 style={{ color: 'var(--mt-text-primary)', fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            Bienvenido de nuevo
          </h1>
          <p style={{ color: 'var(--mt-text-secondary)', fontSize: '14px', margin: 0, textAlign: 'center' }}>
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'var(--mt-text-primary)', fontSize: '13px', fontWeight: 500 }}>
              Usuario
            </label>
            <Input
              type="text"
              placeholder="Ingresa tu usuario (mitron)"
              {...form.register('email')}
              style={{ width: '100%', padding: '12px 16px', backgroundColor: 'var(--mt-surface-subtle)', fontSize: '14px' }}
            />
            {form.formState.errors.email && <span style={{ color: '#fb7185', fontSize: '12px' }}>{form.formState.errors.email.message}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'var(--mt-text-primary)', fontSize: '13px', fontWeight: 500 }}>
              Contraseña
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
              style={{ width: '100%', padding: '12px 16px', backgroundColor: 'var(--mt-surface-subtle)', fontSize: '14px', letterSpacing: '2px' }}
            />
            {form.formState.errors.password && <span style={{ color: '#fb7185', fontSize: '12px' }}>{form.formState.errors.password.message}</span>}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            variant="primary"
            style={{ width: '100%', marginTop: '12px', height: '48px', fontSize: '15px' }}
          >
            {isLoading ? (
              <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              <>Iniciar sesión <ArrowRight size={16} className="ml-2" /></>
            )}
          </Button>
        </form>
      </div>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
