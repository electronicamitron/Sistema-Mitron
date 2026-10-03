import { useState, useMemo } from 'react';
import { getLocalYYYYMMDD } from '../lib/utils';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, ShieldAlert, Truck, Tag, Filter } from 'lucide-react';
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
  const { events, setEvents, expenses, supplyRecords, crmTasks, products, addNotification } = useData();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filter for system events
  const [showSystemEvents, setShowSystemEvents] = useState(true);

  // Generate system events on the fly
  const systemEvents = useMemo(() => {
    const generated: AppEvent[] = [];

    expenses.forEach(e => {
      const paid = e.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
      if (e.dueDate && (e.total - paid > 0)) {
        generated.push({
          id: `sys-pay-${e.id}`,
          title: `Pago: ${e.supplierName}`,
          date: e.dueDate,
          type: 'pago',
          description: `Factura ${e.serie || ''}${e.folio || ''} por pagar.`,
          status: 'pendiente',
          sourceType: 'PAYMENT_DUE',
          sourceId: e.id,
          isSystemGenerated: true,
        });
      }
    });

    supplyRecords.forEach(s => {
      if (s.expectedDate && (s.status === 'PEDIDO' || s.status === 'EN TRÁNSITO' || s.status === 'PARCIAL')) {
        const p = products.find(prod => prod.id === s.productId);
        generated.push({
          id: `sys-sup-${s.id}`,
          title: `Llegada: ${p?.sku || s.productId}`,
          date: s.expectedDate,
          type: 'inventario',
          description: `Se esperan ${s.quantityOrdered - s.quantityReceived} unidades.`,
          status: 'pendiente',
          sourceType: 'SUPPLY_ARRIVAL',
          sourceId: s.id,
          isSystemGenerated: true,
        });
      }
    });

    crmTasks.forEach(t => {
      if (t.dueDate && t.status === 'PENDIENTE') {
        generated.push({
          id: `sys-crm-${t.id}`,
          title: `Seguimiento: ${t.title}`,
          date: t.dueDate,
          type: 'operativo',
          description: t.reason,
          status: 'pendiente',
          sourceType: 'REQUEST_FOLLOWUP',
          sourceId: t.id,
          isSystemGenerated: true,
        });
      }
    });

    return generated;
  }, [expenses, supplyRecords, crmTasks, products]);

  const allEvents = useMemo(() => {
    // Filter out any legacy system events that might have been saved in localStorage
    const manualEvents = events.filter(e => !e.isSystemGenerated);
    return showSystemEvents ? [...manualEvents, ...systemEvents] : manualEvents;
  }, [events, systemEvents, showSystemEvents]);

  const addEvent = (event: Omit<AppEvent, 'id'>) => {
    setEvents(prev => [...prev, { ...event, id: Date.now().toString() }]);
  };

  const updateEvent = (id: string, event: Partial<AppEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...event } : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

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
    form.reset({ title: '', type: 'operativo', description: '', date: getLocalYYYYMMDD(d) });
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (e: React.MouseEvent, event: AppEvent) => {
    e.stopPropagation();
    if (event.isSystemGenerated) {
      addNotification({ title: 'Evento automático', description: 'Este evento se genera automáticamente. Edita el registro original (Factura, Abastecimiento o Solicitud).', type: 'info' });
      return;
    }
    setEditingId(event.id);
    form.reset({ title: event.title, type: event.type, description: event.description, date: event.date });
    setIsEventModalOpen(true);
  };

  const onSubmit = (data: EventFormValues) => {
    if (editingId) {
      updateEvent(editingId, { ...data, description: data.description || '' });
      addNotification({ title: 'Evento actualizado', description: `Se modificó el evento: ${data.title}`, type: 'success' });
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
    const dateStr = getLocalYYYYMMDD(new Date(year, month, day));
    return allEvents.filter(e => e.date === dateStr);
  };

  const getEventStyle = (eventType: EventType, isSystem?: boolean) => {
    if (isSystem) {
      switch (eventType) {
        case 'pago': return { color: 'text-amber-300', bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: <ShieldAlert size={10} className="mr-1" /> };
        case 'inventario': return { color: 'text-emerald-300', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', icon: <Truck size={10} className="mr-1" /> };
        case 'operativo': return { color: 'text-blue-300', bg: 'bg-blue-500/5', border: 'border-blue-500/20', icon: <Tag size={10} className="mr-1" /> };
        default: return { color: 'text-blue-300', bg: 'bg-blue-500/5', border: 'border-blue-500/20', icon: null };
      }
    }
    switch (eventType) {
      case 'pago': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-400/30', icon: null };
      case 'fiscal': return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-400/30', icon: null };
      case 'inventario': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-400/30', icon: null };
      default: return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-400/30', icon: null };
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="mt-page-header mb-0 items-center">
        <div>
          <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Calendario</h1>
          <p className="mt-page-subtitle text-sm text-mt-text-secondary">Agenda, pagos pendientes, llegadas de stock y seguimientos.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSystemEvents(!showSystemEvents)}
            className={`flex items-center gap-2 border px-4 py-2.5 rounded-lg cursor-pointer transition-all font-medium hover:bg-mt-surface-hover ${showSystemEvents ? 'bg-mt-text-primary text-mt-bg border-mt-text-primary' : 'bg-mt-surface-subtle text-mt-text-secondary border-mt-border'}`}
          >
            <Filter size={16} />
            <span className="text-sm">Eventos Automáticos</span>
          </button>
          <button 
            onClick={() => { 
              const d = new Date();
              setEditingId(null);
              form.reset({ title: '', type: 'operativo', description: '', date: getLocalYYYYMMDD(d) });
              setIsEventModalOpen(true); 
            }}
            className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 rounded-lg cursor-pointer text-blue-400 transition-all font-medium hover:bg-blue-500/20"
          >
            <Plus size={16} />
            <span className="text-sm">Nuevo Evento</span>
          </button>
        </div>
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

        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-7 gap-[1px] bg-mt-border-subtle border border-mt-border-subtle rounded-xl overflow-hidden min-w-[700px]">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
            <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-mt-text-secondary bg-mt-surface-subtle">{d}</div>
          ))}
          
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`blank-${i}`} className="bg-mt-bg opacity-30 min-h-[130px]"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day, currentDate.getMonth(), currentDate.getFullYear());
            
            // Fix impure function by not calling new Date() every render, but we can't use hooks here. We'll use a snapshot.
            // (Assuming this runs close enough to "today", Date.now is fine, but to be pure we could use a ref or state for 'today' at the top level).
            const today = new Date();
            const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

            return (
              <div 
                key={day} 
                onClick={() => handleDayClick(day)} 
                className={`p-3 min-h-[130px] cursor-pointer transition-colors relative group border-t-2 ${isToday ? 'bg-blue-500/5 border-blue-400 hover:bg-blue-500/10' : 'bg-mt-surface border-transparent hover:bg-mt-surface-hover'}`}
              >
                <div className={`text-[13px] mb-3 flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'font-bold text-blue-400 bg-blue-400/10' : 'font-medium text-mt-text-secondary'}`}>
                  {day}
                </div>
                
                {dayEvents.slice(0, 4).map(ev => {
                  const style = getEventStyle(ev.type, ev.isSystemGenerated);
                  return (
                    <div 
                      key={ev.id}
                      onClick={(e) => handleEditEvent(e, ev)}
                      className={`text-[10px] px-1.5 py-1 rounded-md border mb-1 font-medium leading-tight flex flex-col gap-0.5 overflow-hidden hover:brightness-125 transition-all ${style.bg} ${style.color} ${style.border} ${ev.isSystemGenerated ? 'border-dashed' : ''}`}
                      title={ev.description}
                    >
                      <div className="flex items-start">
                        {style.icon}
                        <span className="flex-1 break-words line-clamp-2">{ev.title}</span>
                      </div>
                    </div>
                  );
                })}
                {dayEvents.length > 4 && (
                  <div className="text-[10px] text-mt-text-secondary text-center mt-1 font-medium">
                    +{dayEvents.length - 4} más
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title={editingId ? "Editar Evento" : "Nuevo Evento"} width="450px">
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
          <div className="flex justify-between items-center mt-4">
            {editingId ? (
              <Button type="button" variant="ghost" size="sm" onClick={handleDelete} className="text-rose-400 hover:text-rose-300 gap-1.5">
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
