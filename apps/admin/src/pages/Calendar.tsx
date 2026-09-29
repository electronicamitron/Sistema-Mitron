import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Modal, Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@mitron/ui';
import { useData, type AppEvent, type EventType } from '../context/DataContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const eventSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  date: z.string().min(1, 'La fecha es requerida'),
  type: z.enum(['operativo', 'pago', 'fiscal', 'inventario']),
  description: z.string().optional()
});
type EventFormValues = z.infer<typeof eventSchema>;

export default function Calendar() {
  const { events, addEvent, updateEvent, deleteEvent, addNotification } = useData();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const currentMonthStr = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { title: '', type: 'operativo', description: '', date: '' }
  });

  const handleDayClick = (day: number) => {
    setEditingId(null);
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    form.reset({ title: '', type: 'operativo', description: '', date: d.toISOString().split('T')[0] });
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (e: React.MouseEvent, event: AppEvent) => {
    e.stopPropagation();
    setEditingId(event.id);
    form.reset({ title: event.title, type: event.type, description: event.description, date: event.date });
    setIsEventModalOpen(true);
  };

  const onSubmit = (data: EventFormValues) => {
    if (editingId) {
      updateEvent(editingId, { ...data, description: data.description || '' });
      addNotification({ title: 'Evento actualizado', description: `Se modificó el evento: ${data.title}`, type: 'info' });
    } else {
      addEvent({ ...data, description: data.description || '', status: 'pendiente' });
      addNotification({ title: 'Nuevo evento', description: `Se agregó al calendario: ${data.title}`, type: 'success' });
    }
    setIsEventModalOpen(false);
  };

  const handleDelete = () => {
    if (editingId) {
      deleteEvent(editingId);
      addNotification({ title: 'Evento eliminado', description: 'El evento fue removido del calendario.', type: 'info' });
      setIsEventModalOpen(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const getEventsForDay = (day: number, month: number, year: number) => {
    const dateStr = new Date(year, month, day, 12).toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const getEventStyle = (eventType: EventType) => {
    switch (eventType) {
      case 'pago': return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.2)' };
      case 'fiscal': return { color: '#fb7185', bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.2)' };
      case 'inventario': return { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.2)' };
      default: return { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.2)' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="mt-page-header" style={{ marginBottom: 0, alignItems: 'center' }}>
        <div>
          <h1 className="mt-page-title" style={{ fontSize: '28px', letterSpacing: '-0.8px', marginBottom: '4px' }}>Calendario</h1>
          <p className="mt-page-subtitle" style={{ fontSize: '14px', color: 'var(--mt-text-secondary)' }}>Eventos, pagos y fechas clave.</p>
        </div>
        <button 
          onClick={() => { 
            const d = new Date();
            setEditingId(null);
            form.reset({ title: '', type: 'operativo', description: '', date: d.toISOString().split('T')[0] });
            setIsEventModalOpen(true); 
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', 
            backgroundColor: '#FFFFFF', border: 'none', 
            padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', 
            color: '#000000', transition: 'all 0.2s', fontWeight: 600
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'} 
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={16} />
          <span style={{ fontSize: '14px' }}>Nuevo Evento</span>
        </button>
      </div>

      <div className="mt-panel" style={{ borderRadius: '12px', border: '1px solid var(--mt-border)', backgroundColor: 'var(--mt-surface)', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarIcon size={24} style={{ color: 'var(--mt-text-primary)' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--mt-text-primary)', margin: 0, letterSpacing: '-0.5px' }}>{currentMonthStr}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--mt-surface-subtle)', padding: '4px', borderRadius: '8px', border: '1px solid var(--mt-border)' }}>
            <button 
              onClick={handlePrevMonth}
              style={{ background: 'transparent', border: 'none', color: 'var(--mt-text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            ><ChevronLeft size={18} /></button>
            <button 
              onClick={handleToday}
              style={{ background: 'transparent', border: 'none', color: 'var(--mt-text-primary)', cursor: 'pointer', padding: '6px 12px', fontSize: '13px', fontWeight: 600, borderRadius: '4px' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >Hoy</button>
            <button 
              onClick={handleNextMonth}
              style={{ background: 'transparent', border: 'none', color: 'var(--mt-text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            ><ChevronRight size={18} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: 'var(--mt-border-subtle)', border: '1px solid var(--mt-border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
            <div key={d} style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--mt-text-secondary)', backgroundColor: 'var(--mt-surface-subtle)' }}>{d}</div>
          ))}
          
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`blank-${i}`} style={{ backgroundColor: 'var(--mt-bg)', opacity: 0.3, minHeight: '120px' }}></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day, currentDate.getMonth(), currentDate.getFullYear());
            const today = new Date();
            const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

            return (
              <div 
                key={day} 
                onClick={() => handleDayClick(day)} 
                style={{ 
                  padding: '12px', minHeight: '120px', 
                  backgroundColor: isToday ? 'rgba(59, 130, 246, 0.05)' : 'var(--mt-surface)', 
                  cursor: 'pointer', transition: 'background-color 0.2s ease',
                  position: 'relative',
                  borderTop: isToday ? '2px solid #60a5fa' : 'none'
                }} 
                onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface-hover)'} 
                onMouseOut={e => e.currentTarget.style.backgroundColor = isToday ? 'rgba(59, 130, 246, 0.05)' : 'var(--mt-surface)'}
              >
                <div style={{ 
                  fontSize: '13px', fontWeight: isToday ? 700 : 500, 
                  color: isToday ? '#60a5fa' : 'var(--mt-text-secondary)', 
                  marginBottom: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '24px', height: '24px', borderRadius: '50%',
                  backgroundColor: isToday ? 'rgba(96, 165, 250, 0.1)' : 'transparent'
                }}>{day}</div>
                
                {dayEvents.slice(0, 3).map(ev => {
                  const style = getEventStyle(ev.type);
                  return (
                    <div 
                      key={ev.id}
                      onClick={(e) => handleEditEvent(e, ev)}
                      style={{ 
                        fontSize: '11px', padding: '6px 8px', 
                        backgroundColor: style.bg, color: style.color, 
                        borderRadius: '6px', border: `1px solid ${style.border}`, 
                        marginBottom: '4px', fontWeight: 500, lineHeight: 1.2,
                        display: 'flex', flexDirection: 'column', gap: '2px',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{ev.title}</span>
                        {ev.isMock && <span style={{ fontSize: '9px', backgroundColor: 'rgba(0,0,0,0.1)', padding: '1px 4px', borderRadius: '4px', flexShrink: 0 }}>DEMO</span>}
                      </div>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', textAlign: 'center', marginTop: '4px', fontWeight: 500 }}>
                    +{dayEvents.length - 3} más
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title={editingId ? "Editar Evento" : "Nuevo Evento"}>
        <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--mt-text-primary)', marginBottom: '8px', fontWeight: 500 }}>Título del evento</label>
            <Input type="text" placeholder="Ej. Revisión de inventario" {...form.register('title')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--mt-text-primary)', marginBottom: '8px', fontWeight: 500 }}>Fecha</label>
              <Input 
                type="date"
                {...form.register('date')}
                onChange={(e) => {
                  form.setValue('date', e.target.value);
                  const d = new Date(e.target.value + 'T12:00:00');
                  setCurrentDate(d);
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--mt-text-primary)', marginBottom: '8px', fontWeight: 500 }}>Categoría</label>
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operativo">Operativo</SelectItem>
                      <SelectItem value="pago">Pago a proveedor</SelectItem>
                      <SelectItem value="fiscal">Fiscal</SelectItem>
                      <SelectItem value="inventario">Inventario</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--mt-text-primary)', marginBottom: '8px', fontWeight: 500 }}>Descripción (Opcional)</label>
            <Input type="text" placeholder="Detalles adicionales" {...form.register('description')} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            {editingId ? (
              <Button type="button" variant="danger" size="sm" onClick={handleDelete} style={{ gap: '6px' }}>
                <Trash2 size={14} /> Eliminar
              </Button>
            ) : <div />}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button type="button" variant="ghost" size="md" onClick={() => setIsEventModalOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" size="md">Guardar</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
