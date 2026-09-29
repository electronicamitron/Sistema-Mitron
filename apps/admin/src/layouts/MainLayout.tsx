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
  const { notifications, products } = useData();
  
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const inventoryAlerts = products.filter(p => (p.stock !== null && p.stock <= p.minStock) || p.stock === null).length;

  const getPageTitle = () => {
    if (location.pathname.includes('dashboard')) return 'Dashboard';
    if (location.pathname.includes('administration')) return 'Administración';
    if (location.pathname.includes('inventory')) return 'Inventario';
    if (location.pathname.includes('catalog')) return 'Catálogo';
    if (location.pathname.includes('calendar')) return 'Calendario';
    return '';
  };

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/administration', icon: <Briefcase size={18} />, label: 'Administración' },
    { to: '/inventory', icon: <Package size={18} />, label: 'Inventario', badge: inventoryAlerts > 0 ? inventoryAlerts.toString() : undefined },
    { to: '/catalog', icon: <List size={18} />, label: 'Catálogo' },
    { to: '/calendar', icon: <CalendarIcon size={18} />, label: 'Calendario' },
  ];

  return (
    <div className="mt-app">
      <aside className="mt-sidebar" style={{ 
        width: '260px', 
        padding: '24px 20px', 
        backgroundColor: 'var(--mt-bg)', 
        borderRight: '1px solid var(--mt-border)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
      }}>
        <div className="mt-nav-section" style={{ padding: 0 }}>
          <div className="mt-brand" style={{ padding: '0 8px 32px', border: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <img src="/logo2.png" alt="Electrónica Mitron" style={{ height: '36px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span style="color:#FFF;font-size:18px;font-weight:bold;">MITRON</span>'; }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'var(--mt-text-primary)', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>MITRON</span>
              <span style={{ color: 'var(--mt-text-secondary)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>Sistema</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--mt-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 12px 12px' }}>Principal</div>
            {navItems.map(item => (
              <NavLink 
                key={item.to}
                to={item.to} 
                className={({ isActive }) => `mt-nav-item ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '12px', 
                  padding: '10px 12px', borderRadius: '8px',
                  color: isActive ? 'var(--mt-text-primary)' : 'var(--mt-text-secondary)',
                  backgroundColor: isActive ? 'var(--mt-surface-subtle)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s ease',
                  textDecoration: 'none'
                })}
              >
                {item.icon}
                <span style={{ fontSize: '14px' }}>{item.label}</span>
                {item.badge && (
                  <span style={{ 
                    marginLeft: 'auto', backgroundColor: '#fbbf24', color: '#3F2C00', 
                    padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 
                  }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="mt-sidebar-bottom" style={{ borderTop: 'none', gap: '16px', paddingTop: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button 
              className="mt-nav-item" 
              onClick={() => alert('Ajustes no disponibles en esta demo')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', color: 'var(--mt-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '14px', transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface-subtle)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Settings size={18} />
              Ajustes
            </button>
            <button 
              className="mt-nav-item" 
              onClick={logout} 
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', color: 'var(--mt-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '14px', transition: 'all 0.2s' }}
              onMouseOver={e => {e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.1)'; e.currentTarget.style.color = '#fb7185';}} onMouseOut={e => {e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--mt-text-secondary)';}}
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
          
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
            backgroundColor: 'var(--mt-surface)', border: '1px solid var(--mt-border)', 
            borderRadius: '12px', cursor: 'pointer', transition: 'background-color 0.2s'
          }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface)'}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px', 
              backgroundColor: '#3b82f6', color: '#FFFFFF', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '13px', fontWeight: 700 
            }}>
              EV
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mt-text-primary)', lineHeight: 1.2 }}>Evelin</span>
              <span style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>Administración</span>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--mt-text-secondary)' }} />
          </div>
        </div>
      </aside>

      <main className="mt-main" style={{ backgroundColor: 'var(--mt-bg)' }}>
        <header className="mt-header" style={{ 
          height: '64px', padding: '0 32px', borderBottom: '1px solid var(--mt-border)', 
          backgroundColor: 'var(--mt-bg)', position: 'sticky', top: 0, zIndex: 40 
        }}>
          <div className="mt-breadcrumbs" style={{ fontSize: '13px' }}>
            <span style={{ color: 'var(--mt-text-muted)' }}>Mitron</span>
            <span style={{ color: 'var(--mt-text-muted)', margin: '0 4px' }}>/</span>
            <span className="mt-breadcrumb-current" style={{ color: 'var(--mt-text-primary)', fontWeight: 500 }}>{getPageTitle()}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              style={{ 
                background: 'var(--mt-surface)', border: '1px solid var(--mt-border)', 
                color: 'var(--mt-text-primary)', cursor: 'pointer', position: 'relative', 
                width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface)'}
            >
              <Bell size={18} />
              {unreadNotifs > 0 && (
                <span style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, backgroundColor: '#fbbf24', border: '2px solid var(--mt-surface)', borderRadius: '50%' }}></span>
              )}
            </button>
            <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>
        </header>
        <div className="mt-content" style={{ padding: '32px', maxWidth: '1400px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
