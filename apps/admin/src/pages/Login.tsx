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
    <div className="min-h-screen bg-mt-bg flex items-center justify-center p-6 animate-fade-in" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)' }}>
      
      <div className="w-full max-w-[400px] bg-mt-surface rounded-2xl py-12 px-10 border border-mt-border shadow-mt-hover">
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center mb-6">
            <img src="/logo2.png" alt="Electrónica Mitron" className="h-16 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-white text-2xl font-bold tracking-widest">MITRON</span>'; }} />
          </div>
          <h1 className="text-mt-text-primary text-2xl font-semibold m-0 mb-2 tracking-tight">
            Bienvenido de nuevo
          </h1>
          <p className="text-mt-text-secondary text-sm m-0 text-center">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-mt-text-primary text-sm font-medium">
              Usuario
            </label>
            <Input
              type="text"
              placeholder="Ingresa tu usuario (mitron)"
              {...form.register('email')}
              className="w-full px-4 py-3 bg-mt-surface-subtle text-sm"
            />
            {form.formState.errors.email && <span className="text-red-400 text-xs">{form.formState.errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-mt-text-primary text-sm font-medium">
              Contraseña
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
              className="w-full px-4 py-3 bg-mt-surface-subtle text-sm tracking-[2px]"
            />
            {form.formState.errors.password && <span className="text-red-400 text-xs">{form.formState.errors.password.message}</span>}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            variant="primary"
            className="w-full mt-3 h-12 text-[15px]"
          >
            {isLoading ? (
              <span className="inline-block w-[18px] h-[18px] border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>Iniciar sesión <ArrowRight size={16} className="ml-2" /></>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
