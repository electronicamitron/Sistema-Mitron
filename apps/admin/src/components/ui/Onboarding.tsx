import { useState, useEffect } from 'react';
import { Modal, Button } from '@mitron/ui';
import { Sparkles, X, ChevronLeft, ChevronRight, LayoutDashboard, Briefcase, Package, List, Users, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TOUR_STEPS = [
  {
    type: 'modal',
    title: 'Bienvenido a Sistema Mitron',
    description: 'Hemos unificado tu gestión en un ERP + CRM ligero. Aquí los datos se capturan una sola vez y alimentan toda la empresa.',
    icon: <Sparkles size={32} className="text-amber-400" />
  },
  {
    type: 'tooltip',
    targetId: 'tour-nav-dashboard',
    title: 'Dashboard Financiero',
    description: 'Mide tu rendimiento en tiempo real. Obtén métricas de utilidad, margen bruto y flujo neto.',
    icon: <LayoutDashboard size={20} className="text-blue-400" />,
    route: '/dashboard'
  },
  {
    type: 'tooltip',
    targetId: 'tour-nav-administration',
    title: 'Administración Inteligente',
    description: 'Importa tus XML de compras y archivos TXT de ventas. El sistema derivará costos, proveedores e inventario.',
    icon: <Briefcase size={20} className="text-emerald-400" />,
    route: '/administration'
  },
  {
    type: 'tooltip',
    targetId: 'tour-nav-inventory',
    title: 'Inventario y Abastecimiento',
    description: 'Conoce exactamente tus existencias, movimientos por documento y planea abastecimiento.',
    icon: <Package size={20} className="text-rose-400" />,
    route: '/inventory'
  },
  {
    type: 'tooltip',
    targetId: 'tour-nav-catalog',
    title: 'Catálogo Unificado',
    description: 'Directorio de productos con clasificación y precios derivados del XML (costos directos e indirectos).',
    icon: <List size={20} className="text-purple-400" />,
    route: '/catalog'
  },
  {
    type: 'tooltip',
    targetId: 'tour-nav-crm',
    title: 'CRM y Cotizaciones',
    description: 'Control de clientes, seguimientos y cotizaciones enlazadas a inventario.',
    icon: <Users size={20} className="text-amber-500" />,
    route: '/crm'
  },
  {
    type: 'tooltip',
    targetId: 'tour-nav-calendar',
    title: 'Calendario',
    description: 'Visión unificada de tus próximos seguimientos de CRM, vencimientos de pago y entregas esperadas.',
    icon: <CalendarIcon size={20} className="text-cyan-400" />,
    route: '/calendar'
  },
  {
    type: 'modal',
    title: '¡Estás listo!',
    description: 'Recuerda: menos es más. Sistema Mitron evitará que trabajes doble.',
    icon: <Sparkles size={32} className="text-emerald-400" />
  }
];

export function Onboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const version = localStorage.getItem('mitron_onboarding_version');
    if (version !== 'v2') {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    const handleTrigger = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener('trigger-onboarding', handleTrigger);
    return () => window.removeEventListener('trigger-onboarding', handleTrigger);
  }, []);

  const updatePosition = () => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStep];
    if (step.type === 'tooltip' && step.targetId) {
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTooltipPos({
          top: rect.top,
          left: rect.right + 12
        });
        
        // Also highlight element
        el.style.position = 'relative';
        el.style.zIndex = '9999';
        el.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        el.style.boxShadow = '0 0 0 4px rgba(255, 255, 255, 0.05)';
        return () => {
          el.style.zIndex = '';
          el.style.backgroundColor = '';
          el.style.boxShadow = '';
        };
      }
    }
  };

  useEffect(() => {
    const cleanup = updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
      if (cleanup) cleanup();
    };
  }, [currentStep, isOpen]);

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      const step = TOUR_STEPS[prevStep];
      if (step.route) navigate(step.route);
      setCurrentStep(prevStep);
    }
  };

  const handleNext = () => {
    const nextStep = currentStep + 1;
    if (nextStep < TOUR_STEPS.length) {
      const step = TOUR_STEPS[nextStep];
      if (step.route) navigate(step.route);
      setCurrentStep(nextStep);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    localStorage.setItem('mitron_onboarding_version', 'v2');
    setIsOpen(false);
    
    // Clear styles
    TOUR_STEPS.forEach(s => {
      if (s.targetId) {
        const el = document.getElementById(s.targetId);
        if (el) {
          el.style.zIndex = '';
          el.style.backgroundColor = '';
          el.style.boxShadow = '';
        }
      }
    });
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  if (step.type === 'modal') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="" width="400px">
        <div className="flex flex-col items-center text-center p-6 gap-6 relative">
          <button onClick={handleClose} className="absolute top-2 right-2 text-mt-text-secondary hover:text-mt-text-primary p-2">
            <X size={16} />
          </button>
          
          <div className="bg-mt-surface-subtle p-4 rounded-full border border-mt-border shadow-sm">
            {step.icon}
          </div>
          
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold tracking-tight text-mt-text-primary">{step.title}</h2>
            <p className="text-sm text-mt-text-secondary leading-relaxed px-2">
              {step.description}
            </p>
          </div>

          <div className="flex w-full gap-3 mt-4">
            {currentStep === 0 && (
              <Button variant="ghost" className="flex-1" onClick={handleClose}>
                Omitir
              </Button>
            )}
            <Button variant="primary" className="flex-1" onClick={handleNext}>
              {currentStep === 0 ? 'Iniciar recorrido' : 'Terminar'}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Tooltip mode
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[9998] transition-opacity" />
      <div 
        className="fixed z-[9999] bg-mt-surface border border-mt-border shadow-2xl rounded-xl p-5 w-[320px] transition-all duration-300 animate-fade-in"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-mt-surface-subtle rounded-lg shrink-0">
            {step.icon}
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-mt-text-primary text-[15px]">{step.title}</h3>
              <button onClick={handleClose} className="text-mt-text-muted hover:text-mt-text-primary transition-colors">
                <X size={14} />
              </button>
            </div>
            <p className="text-[13px] text-mt-text-secondary leading-relaxed mb-4">
              {step.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-mt-text-muted">
                Paso {currentStep} de {TOUR_STEPS.length - 1}
              </span>
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button variant="ghost" size="sm" onClick={handlePrev} className="gap-1 px-2">
                    <ChevronLeft size={14} /> Anterior
                  </Button>
                )}
                <Button variant="primary" size="sm" onClick={handleNext} className="gap-1.5 px-3">
                  {currentStep === TOUR_STEPS.length - 2 ? 'Finalizar' : 'Siguiente'} <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Left pointing triangle */}
        <div className="absolute top-5 -left-[9px] w-4 h-4 bg-mt-surface border-l border-b border-mt-border rotate-45" />
      </div>
    </>
  );
}
