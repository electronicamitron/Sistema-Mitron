import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Package, List, Calendar as CalendarIcon, Bell, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { NotificationPanel } from '../components/domain/NotificationPanel';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';


export default function MainLayout() {
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { logout } = useAuth();
  const { notifications } = useData();
  
  const unreadNotifs = notifications.filter(n => !n.read).length;


  const getPageTitle = () => {
    if (location.pathname.includes('dashboard')) return 'Dashboard';
    if (location.pathname.includes('administration')) return 'Administración';
    if (location.pathname.includes('inventory')) return 'Inventario';
    if (location.pathname.includes('catalog')) return 'Catálogo';
    if (location.pathname.includes('pricing')) return 'Precios';
    if (location.pathname.includes('calendar')) return 'Calendario';
    return '';
  };

  const navItems: Array<{ to: string, icon: React.ReactNode, label: string, badge?: string }> = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/administration', icon: <Briefcase size={18} />, label: 'Administración' },
    { to: '/inventory', icon: <Package size={18} />, label: 'Inventario' },
    { to: '/catalog', icon: <List size={18} />, label: 'Catálogo' },
    { to: '/calendar', icon: <CalendarIcon size={18} />, label: 'Calendario' },
  ];

  return (
    <div className="flex h-screen bg-mt-bg text-mt-text-primary overflow-hidden font-sans">
      <aside className="w-[260px] px-5 py-6 bg-mt-bg border-r border-mt-border flex flex-col justify-between z-50">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2 pb-6 border-none">
            <div className="flex items-center justify-center">
              <img src="/logo2.png" alt="Electrónica Mitron" className="h-9 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span style="color:#FFF;font-size:18px;font-weight:bold;">MITRON</span>'; }} />
            </div>
            <div className="flex flex-col">
              <span className="text-mt-text-primary font-bold text-[15px] tracking-[-0.3px] leading-[1.2]">MITRON</span>
              <span className="text-mt-text-secondary text-[11px] tracking-[1px] uppercase font-semibold">Sistema</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="text-[11px] font-semibold text-mt-text-muted uppercase tracking-[0.5px] px-3 pb-3">Principal</div>
            {navItems.map(item => (
              <NavLink 
                key={item.to}
                to={item.to} 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline transition-colors ${isActive ? 'bg-mt-surface-subtle text-mt-text-primary font-semibold' : 'bg-transparent text-mt-text-secondary font-medium hover:bg-mt-surface-subtle/50'}`
                }
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-amber-400 text-[#3F2C00] px-2 py-0.5 rounded-full text-[11px] font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-none pt-0">
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => alert('Ajustes no disponibles en esta demo')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-mt-text-secondary bg-transparent border-none cursor-pointer font-medium text-sm transition-colors hover:bg-mt-surface-subtle"
            >
              <Settings size={18} />
              Ajustes
            </button>
            <button 
              onClick={logout} 
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-mt-text-secondary bg-transparent border-none cursor-pointer font-medium text-sm transition-colors hover:bg-rose-400/10 hover:text-rose-400"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-mt-surface border border-mt-border rounded-xl cursor-pointer transition-colors hover:bg-mt-surface-hover">
            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center text-[13px] font-bold">
              EV
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-[13px] font-semibold text-mt-text-primary leading-[1.2]">Evelin</span>
              <span className="text-[11px] text-mt-text-secondary">Administración</span>
            </div>
            <ChevronRight size={16} className="text-mt-text-secondary" />
          </div>
        </div>
      </aside>

      <main className="flex flex-col flex-1 h-screen overflow-hidden bg-mt-bg relative">
        <header className="h-16 px-8 flex items-center justify-between border-b border-mt-border bg-mt-bg sticky top-0 z-40">
          <div className="text-[13px] text-mt-text-muted">
            <span>Mitron</span>
            <span className="mx-1">/</span>
            <span className="text-mt-text-primary font-medium">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-5 relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="bg-mt-surface border border-mt-border text-mt-text-primary cursor-pointer relative w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-mt-surface-hover"
            >
              <Bell size={18} />
              {unreadNotifs > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-400 border-2 border-mt-surface rounded-full"></span>
              )}
            </button>
            <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 lg:px-12 w-full max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
