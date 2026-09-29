import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Form';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1));
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const currentMonthStr = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setIsEventModalOpen(true);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // 0 (Sun) -> 6, 1 (Mon) -> 0
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  return (
    <div>
      <div className="mt-page-header">
        <div>
          <h1 className="mt-page-title">Calendario</h1>
          <p className="mt-page-subtitle">Eventos y recordatorios</p>
        </div>
        <Button variant="primary" onClick={() => setIsEventModalOpen(true)}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          Nuevo evento
        </Button>
      </div>

      <div className="mt-cal-container">
        <div className="mt-cal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div className="mt-cal-title" style={{ fontSize: '18px', fontWeight: 600 }}>{currentMonthStr}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={handlePrevMonth}><ChevronLeft size={16} /></Button>
            <Button variant="secondary" size="sm" onClick={handleToday}>Hoy</Button>
            <Button variant="secondary" size="sm" onClick={handleNextMonth}><ChevronRight size={16} /></Button>
          </div>
        </div>
        <div className="mt-cal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: 'var(--mt-border)', border: '1px solid var(--mt-border)', borderRadius: '8px', overflow: 'hidden' }}>
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--mt-text-secondary)', backgroundColor: 'var(--mt-surface-subtle)' }}>{d}</div>
          ))}
          
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`blank-${i}`} style={{ backgroundColor: 'var(--mt-bg)', opacity: 0.5 }}></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            return (
              <div key={day} onClick={() => handleDayClick(day)} style={{ padding: '8px', minHeight: '100px', backgroundColor: 'var(--mt-bg)', cursor: 'pointer', transition: 'background-color 0.15s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--mt-bg)'}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--mt-text-secondary)', marginBottom: '8px' }}>{day}</div>
                {day === 15 && (
                  <div style={{ fontSize: '11px', padding: '4px', backgroundColor: '#332512', color: '#E5A93C', borderRadius: '4px', border: '1px solid #5A3E1B', marginBottom: '4px' }}>
                    Pago a PROVEEDOR
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title="Nuevo Recordatorio">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--mt-text-secondary)', marginBottom: '4px' }}>Concepto</label>
            <Input type="text" placeholder="Ej. Revisión de inventario" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--mt-text-secondary)', marginBottom: '4px' }}>Fecha</label>
              <Input type="text" value={selectedDay ? `${selectedDay} de ${currentMonthStr}` : ''} readOnly style={{ backgroundColor: 'var(--mt-surface-subtle)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--mt-text-secondary)', marginBottom: '4px' }}>Tipo</label>
              <Select options={[{label: 'Pago', value: 'pago'}, {label: 'Fiscal', value: 'fiscal'}, {label: 'Operativo', value: 'operativo'}]} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <Button variant="ghost" onClick={() => setIsEventModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => { alert('Acción de interfaz visual. Sin conexión a backend.'); setIsEventModalOpen(false); }}>Guardar recordatorio</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
