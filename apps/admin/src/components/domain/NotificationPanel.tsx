import { X, AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react';
import { useData } from '../../context/DataContext';

export function NotificationPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { notifications, markNotificationAsRead } = useData();
  
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '50px',
      right: '28px',
      width: '320px',
      backgroundColor: 'var(--mt-surface)',
      border: '1px solid var(--mt-border)',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '400px'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--mt-border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Notificaciones</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mt-text-secondary)', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ padding: '8px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {notifications.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--mt-text-muted)', fontSize: '13px' }}>
            No tienes notificaciones
          </div>
        ) : notifications.map(notif => (
          <div 
            key={notif.id} 
            className="mt-notif-item" 
            style={{ 
              display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', 
              borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s',
              backgroundColor: notif.read ? 'transparent' : 'var(--mt-surface-subtle)',
              border: notif.read ? '1px solid transparent' : '1px solid var(--mt-border-subtle)'
            }}
            onClick={() => markNotificationAsRead(notif.id)}
            onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface-hover)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = notif.read ? 'transparent' : 'var(--mt-surface-subtle)'}
          >
            {notif.type === 'alert' && <AlertTriangle size={16} color="#fb7185" style={{ marginTop: '2px' }} />}
            {notif.type === 'warning' && <Clock size={16} color="#fbbf24" style={{ marginTop: '2px' }} />}
            {notif.type === 'success' && <CheckCircle size={16} color="#34d399" style={{ marginTop: '2px' }} />}
            {notif.type === 'info' && <Info size={16} color="#60a5fa" style={{ marginTop: '2px' }} />}
            
            <div className="mt-notif-content" style={{ flex: 1 }}>
              <div className="mt-notif-title" style={{ fontSize: '13px', fontWeight: notif.read ? 500 : 600, color: 'var(--mt-text-primary)' }}>{notif.title}</div>
              <div className="mt-notif-meta" style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>{notif.description}</div>
            </div>
            {!notif.read && (
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', marginTop: '6px' }}></div>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}
