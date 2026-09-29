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
      case 'pago': return { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
      case 'fiscal': return { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' };
      case 'inventario': return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
      default: return { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="mt-page-header mb-0 items-center">
        <div>
          <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Calendario</h1>
          <p className="mt-page-subtitle text-sm text-mt-text-secondary">Eventos, pagos y fechas clave.</p>
        </div>
        <button 
          onClick={() => { 
            const d = new Date();
            setEditingId(null);
            form.reset({ title: '', type: 'operativo', description: '', date: d.toISOString().split('T')[0] });
            setIsEventModalOpen(true); 
          }}
          className="flex items-center gap-2 bg-white border-none px-4 py-2.5 rounded-lg cursor-pointer text-black transition-all font-semibold hover:-translate-y-[1px]"
        >
          <Plus size={16} />
          <span className="text-sm">Nuevo Evento</span>
        </button>
      </div>

      <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarIcon size={24} className="text-mt-text-primary" />
            <h2 className="text-xl font-semibold text-mt-text-primary m-0 tracking-tight">{currentMonthStr}</h2>
          </div>
          <div className="flex items-center gap-2 bg-mt-surface-subtle p-1 rounded-lg border border-mt-border">
            <button 
              onClick={handlePrevMonth}
              className="bg-transparent border-none text-mt-text-secondary cursor-pointer p-1.5 rounded hover:bg-mt-surface transition-colors"
            ><ChevronLeft size={18} /></button>
            <button 
              onClick={handleToday}
              className="bg-transparent border-none text-mt-text-primary cursor-pointer px-3 py-1.5 text-[13px] font-semibold rounded hover:bg-mt-surface transition-colors"
            >Hoy</button>
            <button 
              onClick={handleNextMonth}
              className="bg-transparent border-none text-mt-text-secondary cursor-pointer p-1.5 rounded hover:bg-mt-surface transition-colors"
            ><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-[1px] bg-mt-border-subtle border border-mt-border-subtle rounded-xl overflow-hidden">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
            <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-mt-text-secondary bg-mt-surface-subtle">{d}</div>
          ))}
          
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`blank-${i}`} className="bg-mt-bg opacity-30 min-h-[120px]"></div>
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
                className={`p-3 min-h-[120px] cursor-pointer transition-colors relative group border-t-2 ${isToday ? 'bg-blue-500/5 border-blue-400 hover:bg-blue-500/10' : 'bg-mt-surface border-transparent hover:bg-mt-surface-hover'}`}
              >
                <div className={`text-[13px] mb-3 flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'font-bold text-blue-400 bg-blue-400/10' : 'font-medium text-mt-text-secondary'}`}>
                  {day}
                </div>
                
                {dayEvents.slice(0, 3).map(ev => {
                  const style = getEventStyle(ev.type);
                  return (
                    <div 
                      key={ev.id}
                      onClick={(e) => handleEditEvent(e, ev)}
                      className={`text-[11px] px-2 py-1.5 rounded-md border mb-1 font-medium leading-tight flex flex-col gap-0.5 overflow-hidden ${style.bg} ${style.color} ${style.border}`}
                    >
                      <div className="flex justify-between items-center gap-1">
                        <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-1">{ev.title}</span>
                        {ev.isMock && <span className="text-[9px] bg-black/10 px-1 py-0.5 rounded shrink-0">DEMO</span>}
                      </div>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[11px] text-mt-text-secondary text-center mt-1 font-medium">
                    +{dayEvents.length - 3} más
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title={editingId ? "Editar Evento" : "Nuevo Evento"}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <label className="block text-[13px] text-mt-text-primary mb-2 font-medium">Título del evento</label>
            <Input type="text" placeholder="Ej. Revisión de inventario" {...form.register('title')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-2 font-medium">Fecha</label>
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
              <label className="block text-[13px] text-mt-text-primary mb-2 font-medium">Categoría</label>
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
            <label className="block text-[13px] text-mt-text-primary mb-2 font-medium">Descripción (Opcional)</label>
            <Input type="text" placeholder="Detalles adicionales" {...form.register('description')} />
          </div>
          <div className="flex justify-between items-center mt-6">
            {editingId ? (
              <Button type="button" variant="danger" size="sm" onClick={handleDelete} className="gap-1.5">
                <Trash2 size={14} /> Eliminar
              </Button>
            ) : <div />}
            <div className="flex gap-3">
              <Button type="button" variant="ghost" size="md" onClick={() => setIsEventModalOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" size="md">Guardar</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
