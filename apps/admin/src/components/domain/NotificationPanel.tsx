import { X, AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react';
import { useData } from '../../context/DataContext';

export function NotificationPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { notifications, markNotificationAsRead } = useData();
  
  if (!isOpen) return null;

  return (
    <div className="absolute top-[50px] right-[28px] w-[320px] bg-mt-surface border border-mt-border rounded-lg shadow-2xl z-50 flex flex-col max-h-[400px]">
      <div className="px-4 py-3 border-b border-mt-border-subtle flex justify-between items-center">
        <h3 className="m-0 text-[13px] font-semibold">Notificaciones</h3>
        <button onClick={onClose} className="bg-transparent border-none text-mt-text-secondary cursor-pointer hover:text-mt-text-primary transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="p-2 overflow-y-auto flex-1 flex flex-col gap-2">
        
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-mt-text-muted text-[13px]">
            No tienes notificaciones
          </div>
        ) : notifications.map(notif => (
          <div 
            key={notif.id} 
            className={`flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors ${notif.read ? 'bg-transparent border border-transparent hover:bg-mt-surface-hover' : 'bg-mt-surface-subtle border border-mt-border-subtle hover:bg-mt-surface-hover'}`}
            onClick={() => markNotificationAsRead(notif.id)}
          >
            {notif.type === 'alert' && <AlertTriangle size={16} className="text-rose-400 mt-[2px]" />}
            {notif.type === 'warning' && <Clock size={16} className="text-amber-400 mt-[2px]" />}
            {notif.type === 'success' && <CheckCircle size={16} className="text-emerald-400 mt-[2px]" />}
            {notif.type === 'info' && <Info size={16} className="text-blue-400 mt-[2px]" />}
            
            <div className="flex-1">
              <div className={`text-[13px] text-mt-text-primary ${notif.read ? 'font-medium' : 'font-semibold'}`}>{notif.title}</div>
              <div className="text-[11px] text-mt-text-secondary mt-1">{notif.description}</div>
            </div>
            {!notif.read && (
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}
