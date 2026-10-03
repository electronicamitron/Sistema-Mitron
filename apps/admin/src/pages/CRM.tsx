import { useState } from 'react';
import { useData } from '../context/DataContext';
import { DataTable } from '../components/ui/DataTable';
import { Button, Modal, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@mitron/ui';
import { Users, FileText, CheckSquare, Plus, Pencil, Trash2, PackageSearch, FileDown, PlusCircle } from 'lucide-react';
import { formatDateHuman } from '../lib/utils';
import type { ColumnDef, CellContext } from '@tanstack/react-table';
import type { Client, Quote, CRMTask, ProductRequest, ProductRequestStatus, QuoteLine } from '../types';

export default function CRM() {
  const { clients, addClient, updateClient, quotes, addQuote, deleteQuote, crmTasks, addCRMTask, updateCRMTask, deleteCRMTask, addNotification, products, productRequests, addProductRequest, updateProductRequest, deleteProductRequest } = useData();
  const [activeTab, setActiveTab] = useState<'clientes' | 'cotizaciones' | 'solicitudes' | 'seguimiento'>('clientes');

  // Client Modal
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState<{name: string, type: 'FISICA'|'MORAL'|'SIN ESPECIFICAR', phone: string, email: string, rfc: string, status: 'PROSPECTO'|'CLIENTE'|'INACTIVO'}>({ name: '', type: 'SIN ESPECIFICAR', phone: '', email: '', rfc: '', status: 'PROSPECTO' });

  // Quote Modal (To be expanded for PDF)
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState<{clientId: string, validUntil: string, notes: string, lines: QuoteLine[]}>({ clientId: '', validUntil: '', notes: '', lines: [] });
  const [productSearch, setProductSearch] = useState('');

  // Request modal
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [reqForm, setReqForm] = useState<{description: string, brandModel: string, quantity: number, clientId: string, status: ProductRequestStatus}>({ description: '', brandModel: '', quantity: 1, clientId: '', status: 'PENDIENTE' });

  // Task Modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<{title: string, reason: string, relatedTo: 'GENERAL'|'COTIZACION'|'SOLICITUD', dueDate: string, status: 'PENDIENTE'|'COMPLETADO'|'CANCELADO', clientId: string}>({ title: '', reason: '', relatedTo: 'GENERAL', dueDate: '', status: 'PENDIENTE', clientId: '' });

  const openNewClient = () => {
    setEditingClientId(null);
    setClientForm({ name: '', type: 'SIN ESPECIFICAR', phone: '', email: '', rfc: '', status: 'PROSPECTO' });
    setClientModalOpen(true);
  };

  const openEditClient = (client: Client) => {
    setEditingClientId(client.id);
    const type = client.type && ['FISICA', 'MORAL', 'SIN ESPECIFICAR'].includes(client.type) ? client.type : 'SIN ESPECIFICAR';
    const status = client.status && ['PROSPECTO', 'CLIENTE', 'INACTIVO'].includes(client.status) ? client.status : 'PROSPECTO';
    setClientForm({ name: client.name, type: type as any, phone: client.phone || '', email: client.email || '', rfc: client.rfc || '', status: status as any });
    setClientModalOpen(true);
  };

  const saveClient = () => {
    if (!clientForm.name) return;
    if (editingClientId) {
      updateClient(editingClientId, { ...clientForm });
      addNotification({ title: 'Cliente actualizado', description: 'Cambios guardados', type: 'success' });
    } else {
      addClient({ id: Date.now().toString(), ...clientForm, createdAt: new Date().toISOString() });
      addNotification({ title: 'Cliente creado', description: 'Nuevo cliente registrado', type: 'success' });
    }
    setClientModalOpen(false);
  };

  const openNewTask = () => {
    setEditingTaskId(null);
    setTaskForm({ title: '', reason: '', relatedTo: 'GENERAL', dueDate: '', status: 'PENDIENTE', clientId: '' });
    setTaskModalOpen(true);
  };

  const openEditTask = (task: CRMTask) => {
    setEditingTaskId(task.id);
    setTaskForm({ title: task.title, reason: task.reason, relatedTo: task.relatedTo, dueDate: task.dueDate || '', status: task.status, clientId: task.clientId || '' });
    setTaskModalOpen(true);
  };

  const saveTask = () => {
    if (!taskForm.title) return;
    if (editingTaskId) {
      updateCRMTask(editingTaskId, { ...taskForm });
      addNotification({ title: 'Seguimiento actualizado', description: 'Cambios guardados', type: 'success' });
    } else {
      addCRMTask({ id: Date.now().toString(), ...taskForm, createdAt: new Date().toISOString() });
      addNotification({ title: 'Seguimiento creado', description: 'Nuevo seguimiento registrado', type: 'success' });
    }
    setTaskModalOpen(false);
  };

  const openNewRequest = () => {
    setEditingRequestId(null);
    setReqForm({ description: '', brandModel: '', quantity: 1, clientId: '', status: 'PENDIENTE' });
    setRequestModalOpen(true);
  };

  const openEditRequest = (req: ProductRequest) => {
    setEditingRequestId(req.id);
    setReqForm({ description: req.description, brandModel: req.brandModel || '', quantity: req.quantityRequested, clientId: req.clientId || '', status: req.status });
    setRequestModalOpen(true);
  };

  const saveRequest = () => {
    const data: ProductRequest = {
      id: editingRequestId || Date.now().toString(),
      description: reqForm.description,
      brandModel: reqForm.brandModel || undefined,
      quantityRequested: reqForm.quantity,
      clientId: reqForm.clientId || undefined,
      date: editingRequestId ? (productRequests.find(r => r.id === editingRequestId)?.date || new Date().toISOString()) : new Date().toISOString(),
      status: reqForm.status,
    };
    if (editingRequestId) {
      updateProductRequest(editingRequestId, data);
      addNotification({ title: 'Solicitud actualizada', description: 'Se guardaron los cambios.', type: 'success' });
    } else {
      addProductRequest(data);
      addNotification({ title: 'Solicitud creada', description: `Se registró la solicitud: ${reqForm.description}`, type: 'success' });
    }
    setRequestModalOpen(false);
  };

  const clientColumns: ColumnDef<any, any>[] = [
    { accessorKey: 'name', header: 'Cliente', cell: (info: CellContext<any, any>) => <span className="font-semibold text-mt-text-primary">{info.getValue() as string}</span> },
    { id: 'contact', header: 'Contacto', cell: (info: CellContext<any, any>) => {
      const c = info.row.original as Client;
      return <div className="flex flex-col text-[13px] text-mt-text-secondary"><span>{c.phone || '—'}</span><span>{c.email || ''}</span></div>;
    }},
    { id: 'lastActivity', header: 'Última actividad', cell: () => {
      return <span className="text-sm text-mt-text-secondary">—</span>;
    }},
    { id: 'nextFollowUp', header: 'Próximo seguimiento', cell: (info: CellContext<any, any>) => {
      const c = info.row.original as Client;
      const nextTask = crmTasks.filter(t => t.clientId === c.id && t.status === 'PENDIENTE' && t.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];
      return <span className={`text-sm ${nextTask && new Date(nextTask.dueDate!) < new Date() ? 'text-rose-400' : 'text-mt-text-secondary'}`}>{nextTask ? formatDateHuman(nextTask.dueDate!) : '—'}</span>;
    }},
    { accessorKey: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
      const st = info.getValue() as string;
      return <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${st === 'CLIENTE' ? 'bg-emerald-500/10 text-emerald-400' : st === 'INACTIVO' ? 'bg-mt-surface-subtle text-mt-text-muted' : 'bg-blue-500/10 text-blue-400'}`}>{st}</span>;
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => {
      const c = info.row.original as Client;
      return (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditClient(c)}><Pencil size={14} /></Button>
          <Button variant="ghost" size="sm" onClick={() => { if(confirm('¿Archivar este cliente?')) { updateClient(c.id, { ...c, status: 'INACTIVO' }); } }} className="text-mt-text-muted hover:text-rose-400" title="Archivar"><Trash2 size={14} /></Button>
        </div>
      );
    }}
  ];

  const taskColumns: ColumnDef<any, any>[] = [
    { accessorKey: 'title', header: 'Asunto', cell: (info: CellContext<any, any>) => <span className="font-medium">{info.getValue() as string}</span> },
    { id: 'client', header: 'Cliente', cell: (info: CellContext<any, any>) => {
      const cId = (info.row.original as CRMTask).clientId;
      const client = clients.find(c => c.id === cId);
      return <span className="text-mt-text-secondary">{client?.name || '—'}</span>;
    }},
    { accessorKey: 'relatedTo', header: 'Relacionado con', cell: (info: CellContext<any, any>) => <span className="text-sm">{info.getValue() as string}</span> },
    { accessorKey: 'dueDate', header: 'Fecha', cell: (info: CellContext<any, any>) => {
      const date = info.getValue() as string;
      return <span className={`text-sm ${date && new Date(date) < new Date() ? 'text-rose-400' : 'text-mt-text-secondary'}`}>{date ? formatDateHuman(date) : '—'}</span>;
    }},
    { accessorKey: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
      const st = info.getValue() as CRMTask['status'];
      return <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${st === 'COMPLETADO' ? 'bg-emerald-500/10 text-emerald-400' : st === 'CANCELADO' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>{st}</span>;
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => {
      const t = info.row.original as CRMTask;
      return (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditTask(t)}><Pencil size={14} /></Button>
          <Button variant="ghost" size="sm" onClick={() => { if(confirm('¿Eliminar seguimiento?')) deleteCRMTask(t.id); }} className="text-rose-400"><Trash2 size={14} /></Button>
        </div>
      );
    }}
  ];

  const openNewQuote = () => {
    setQuoteForm({ clientId: '', validUntil: '', notes: '', lines: [] });
    setProductSearch('');
    setQuoteModalOpen(true);
  };

  const addQuoteLine = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    setQuoteForm(prev => ({
      ...prev,
      lines: [...prev.lines, {
        productId: prod.id,
        description: prod.description,
        sku: prod.sku,
        quantity: 1,
        unitPrice: prod.salePrice || 0,
        amount: prod.salePrice || 0
      }]
    }));
    setProductSearch('');
  };

  const updateQuoteLine = (index: number, updates: Partial<QuoteLine>) => {
    setQuoteForm(prev => {
      const newLines = [...prev.lines];
      newLines[index] = { ...newLines[index], ...updates };
      newLines[index].amount = newLines[index].quantity * newLines[index].unitPrice;
      return { ...prev, lines: newLines };
    });
  };

  const removeQuoteLine = (index: number) => {
    setQuoteForm(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }));
  };

  const saveQuote = () => {
    if (!quoteForm.clientId || quoteForm.lines.length === 0) return;
    const subtotal = quoteForm.lines.reduce((acc, line) => acc + line.amount, 0);
    const iva = subtotal * 0.16;
    const newQuote: Quote = {
      id: Date.now().toString(),
      clientId: quoteForm.clientId,
      date: new Date().toISOString(),
      validUntil: quoteForm.validUntil || new Date(Date.now() + 15 * 86400000).toISOString(),
      status: 'BORRADOR',
      lines: quoteForm.lines,
      subtotal, iva, total: subtotal + iva,
      notes: quoteForm.notes
    };
    addQuote(newQuote);
    addNotification({ title: 'Cotización creada', description: 'Nueva cotización generada', type: 'success' });
    setQuoteModalOpen(false);
  };

  const quoteColumns: ColumnDef<any, any>[] = [
    { accessorKey: 'id', header: 'Folio', cell: (info: CellContext<any, any>) => <span className="font-mono text-sm text-mt-text-secondary">COT-{info.getValue() as string}</span> },
    { id: 'client', header: 'Cliente', cell: (info: CellContext<any, any>) => {
      const cId = (info.row.original as Quote).clientId;
      const client = clients.find(c => c.id === cId);
      return <span className="font-medium">{client?.name || '—'}</span>;
    }},
    { accessorKey: 'date', header: 'Fecha', cell: (info: CellContext<any, any>) => <span className="text-sm text-mt-text-secondary">{formatDateHuman(info.getValue() as string)}</span> },
    { accessorKey: 'validUntil', header: 'Vence', cell: (info: CellContext<any, any>) => <span className="text-sm text-mt-text-secondary">{formatDateHuman(info.getValue() as string)}</span> },
    { accessorKey: 'total', header: 'Total', cell: (info: CellContext<any, any>) => <span className="font-semibold text-emerald-400">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(info.getValue() as number)}</span> },
    { accessorKey: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
      const q = info.row.original as Quote;
      let st = q.status;
      if ((st === 'BORRADOR' || st === 'ENVIADA') && q.validUntil && new Date(q.validUntil) < new Date()) {
        st = 'VENCIDA';
      }
      return <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${st === 'ACEPTADA' ? 'bg-emerald-500/10 text-emerald-400' : st === 'RECHAZADA' ? 'bg-rose-500/10 text-rose-400' : st === 'VENCIDA' ? 'bg-mt-surface-subtle text-mt-text-muted' : 'bg-blue-500/10 text-blue-400'}`}>{st}</span>;
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => {
      const q = info.row.original as Quote;
      return (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => alert('Generación de PDF en progreso...')} title="Generar PDF"><FileDown size={14} /></Button>
          <Button variant="ghost" size="sm" onClick={() => { if(confirm('¿Eliminar cotización?')) deleteQuote(q.id); }} className="text-rose-400"><Trash2 size={14} /></Button>
        </div>
      );
    }}
  ];

  const requestColumns: ColumnDef<any, any>[] = [
    { accessorKey: 'description', header: 'Producto solicitado', cell: (info: CellContext<any, any>) => <span className="font-medium text-sm text-mt-text-primary">{info.getValue() as string}</span> },
    { accessorKey: 'brandModel', header: 'Marca/Modelo', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary text-sm">{(info.getValue() as string) || '—'}</span> },
    { accessorKey: 'quantityRequested', header: 'Cantidad', cell: (info: CellContext<any, any>) => <span className="text-sm">{info.getValue() as number}</span> },
    { id: 'client', header: 'Cliente', cell: (info: CellContext<any, any>) => {
      const cId = (info.row.original as ProductRequest).clientId;
      const client = clients.find(c => c.id === cId);
      return <span className="text-mt-text-secondary text-sm">{client?.name || '—'}</span>;
    }},
    { accessorKey: 'date', header: 'Fecha', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary text-sm">{formatDateHuman(info.getValue() as string)}</span> },
    { id: 'nextFollowUp', header: 'Próximo seguimiento', cell: (info: CellContext<any, any>) => {
      const r = info.row.original as ProductRequest;
      if (!r.clientId) return <span className="text-sm text-mt-text-secondary">—</span>;
      const nextTask = crmTasks.filter(t => t.clientId === r.clientId && t.relatedTo === 'SOLICITUD' && t.status === 'PENDIENTE' && t.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];
      return <span className={`text-sm ${nextTask && new Date(nextTask.dueDate!) < new Date() ? 'text-rose-400' : 'text-mt-text-secondary'}`}>{nextTask ? formatDateHuman(nextTask.dueDate!) : '—'}</span>;
    }},
    { accessorKey: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
      const st = info.getValue() as ProductRequestStatus;
      const colors: Record<ProductRequestStatus, string> = {
        'PENDIENTE': 'bg-amber-500/10 text-amber-400',
        'EN PROCESO': 'bg-blue-500/10 text-blue-400',
        'RESUELTA': 'bg-emerald-500/10 text-emerald-400',
        'CERRADA': 'bg-mt-surface-subtle text-mt-text-muted',
      };
      return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[st]}`}>{st}</span>;
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => {
      const r = info.row.original as ProductRequest;
      return (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditRequest(r)}><Pencil size={14} /></Button>
          <Button variant="ghost" size="sm" onClick={() => { if (confirm('¿Eliminar esta solicitud?')) deleteProductRequest(r.id); }} className="text-rose-400"><Trash2 size={14} /></Button>
        </div>
      );
    }}
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="mt-page-header mb-0">
        <div>
          <h1 className="mt-page-title text-[28px] tracking-tight mb-1">CRM</h1>
          <p className="mt-page-subtitle text-sm text-mt-text-secondary">Gestión de clientes, cotizaciones y seguimiento de ventas.</p>
        </div>
        {activeTab === 'clientes' && (
          <button onClick={openNewClient} className="flex items-center gap-2 bg-white border-none px-4 py-2.5 rounded-lg cursor-pointer text-black font-semibold hover:-translate-y-[1px]">
            <Plus size={16} /> <span className="text-sm">Nuevo Cliente</span>
          </button>
        )}
        {activeTab === 'cotizaciones' && (
          <button onClick={openNewQuote} className="flex items-center gap-2 bg-white border-none px-4 py-2.5 rounded-lg cursor-pointer text-black font-semibold hover:-translate-y-[1px]">
            <Plus size={16} /> <span className="text-sm">Nueva Cotización</span>
          </button>
        )}
        {activeTab === 'solicitudes' && (
          <button onClick={openNewRequest} className="flex items-center gap-2 bg-white border-none px-4 py-2.5 rounded-lg cursor-pointer text-black font-semibold hover:-translate-y-[1px]">
            <Plus size={16} /> <span className="text-sm">Nueva Solicitud</span>
          </button>
        )}
        {activeTab === 'seguimiento' && (
          <button onClick={openNewTask} className="flex items-center gap-2 bg-white border-none px-4 py-2.5 rounded-lg cursor-pointer text-black font-semibold hover:-translate-y-[1px]">
            <Plus size={16} /> <span className="text-sm">Nuevo Seguimiento</span>
          </button>
        )}
      </div>

      <div className="flex gap-6 mt-6 border-b border-mt-border">
        {([
          { id: 'clientes' as const, label: 'Clientes', icon: <Users size={16} /> },
          { id: 'cotizaciones' as const, label: 'Cotizaciones', icon: <FileText size={16} /> },
          { id: 'solicitudes' as const, label: 'Solicitudes de Producto', icon: <PackageSearch size={16} /> },
          { id: 'seguimiento' as const, label: 'Seguimiento', icon: <CheckSquare size={16} /> }
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 bg-transparent border-none text-sm cursor-pointer pb-3 transition-all -mb-[1px] ${activeTab === tab.id ? 'text-mt-text-primary font-semibold border-b-2 border-mt-text-primary' : 'text-mt-text-secondary font-medium border-b-2 border-transparent'}`}
          >{tab.icon} {tab.label}</button>
        ))}
      </div>

      {activeTab === 'clientes' && (
        <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5 animate-fade-in">
          {clients.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-mt-text-muted">
              <Users size={48} className="mb-4 opacity-50" />
              <p className="text-sm font-medium">No hay clientes registrados.</p>
            </div>
          ) : (
            <DataTable columns={clientColumns} data={clients} searchKey="name" searchPlaceholder="Buscar cliente..." />
          )}
        </div>
      )}

      {activeTab === 'cotizaciones' && (
        <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5 animate-fade-in">
          {quotes.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-mt-text-muted">
              <FileText size={48} className="mb-4 opacity-50" />
              <p className="text-sm font-medium">No hay cotizaciones.</p>
            </div>
          ) : (
            <DataTable columns={quoteColumns} data={quotes} searchKey="id" searchPlaceholder="Buscar folio..." />
          )}
        </div>
      )}

      {activeTab === 'solicitudes' && (
        <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5 animate-fade-in">
          {productRequests.length === 0 ? (
             <div className="py-12 flex flex-col items-center justify-center text-mt-text-muted">
             <PackageSearch size={48} className="mb-4 opacity-50" />
             <p className="text-sm font-medium">No hay solicitudes de producto.</p>
           </div>
          ) : (
            <DataTable columns={requestColumns} data={productRequests} searchKey="description" searchPlaceholder="Buscar solicitud..." />
          )}
        </div>
      )}

      {activeTab === 'seguimiento' && (
        <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5 animate-fade-in">
          {crmTasks.length === 0 ? (
             <div className="py-12 flex flex-col items-center justify-center text-mt-text-muted">
             <CheckSquare size={48} className="mb-4 opacity-50" />
             <p className="text-sm font-medium">No hay registros de seguimiento.</p>
           </div>
          ) : (
            <DataTable columns={taskColumns} data={crmTasks} searchKey="title" searchPlaceholder="Buscar seguimiento..." />
          )}
        </div>
      )}

      <Modal isOpen={clientModalOpen} onClose={() => setClientModalOpen(false)} title={editingClientId ? 'Editar Cliente' : 'Nuevo Cliente'} width="400px">
        <div className="flex flex-col gap-4">
          <div><label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Nombre / Empresa</label><Input value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} placeholder="Nombre" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Tipo</label>
              <Select value={clientForm.type} onValueChange={v => setClientForm({...clientForm, type: v as any})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="FISICA">Física</SelectItem><SelectItem value="MORAL">Moral</SelectItem><SelectItem value="SIN ESPECIFICAR">Sin especificar</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Estado</label>
              <Select value={clientForm.status} onValueChange={v => setClientForm({...clientForm, status: v as any})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="PROSPECTO">Prospecto</SelectItem><SelectItem value="CLIENTE">Cliente</SelectItem><SelectItem value="INACTIVO">Inactivo</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div><label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Teléfono</label><Input value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} placeholder="Teléfono" /></div>
          <div><label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Email</label><Input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} placeholder="Email" /></div>
          <div><label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">RFC</label><Input value={clientForm.rfc} onChange={e => setClientForm({...clientForm, rfc: e.target.value})} placeholder="RFC" /></div>
          <div className="flex gap-3 mt-2">
            <Button variant="ghost" onClick={() => setClientModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button variant="primary" onClick={saveClient} disabled={!clientForm.name} className="flex-1">Guardar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} title={editingTaskId ? 'Editar Seguimiento' : 'Nuevo Seguimiento'} width="400px">
        <div className="flex flex-col gap-4">
          <div><label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Asunto</label><Input value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="¿De qué se trata este seguimiento?" /></div>
          <div>
            <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Cliente</label>
            <Select value={taskForm.clientId} onValueChange={v => setTaskForm({...taskForm, clientId: v})}>
              <SelectTrigger><SelectValue placeholder="Seleccionar cliente (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ninguno</SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Relacionado con</label>
              <Select value={taskForm.relatedTo} onValueChange={v => setTaskForm({...taskForm, relatedTo: v as any})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="COTIZACION">Cotización</SelectItem>
                  <SelectItem value="SOLICITUD">Solicitud</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Fecha programada</label><Input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} /></div>
          </div>
          <div>
            <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Estado</label>
            <Select value={taskForm.status} onValueChange={v => setTaskForm({...taskForm, status: v as any})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="COMPLETADO">Completado</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="ghost" onClick={() => setTaskModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button variant="primary" onClick={saveTask} disabled={!taskForm.title} className="flex-1">Guardar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={quoteModalOpen} onClose={() => setQuoteModalOpen(false)} title="Nueva Cotización" width="700px">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Cliente</label>
              <Select value={quoteForm.clientId} onValueChange={v => setQuoteForm({...quoteForm, clientId: v})}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Válida hasta (Opcional)</label><Input type="date" value={quoteForm.validUntil} onChange={e => setQuoteForm({...quoteForm, validUntil: e.target.value})} /></div>
          </div>
          
          <div className="border border-mt-border rounded-lg p-4 bg-mt-surface-subtle">
            <h4 className="text-sm font-semibold mb-3">Agregar Productos</h4>
            <div className="flex gap-2 mb-4 relative">
              <Input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar por nombre o SKU..." className="flex-1" />
              {productSearch && (
                <div className="absolute top-10 left-0 right-0 bg-mt-surface border border-mt-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {products.filter(p => p.description.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 10).map(p => (
                    <div key={p.id} className="p-2 border-b border-mt-border last:border-none flex justify-between items-center hover:bg-mt-surface-hover">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{p.description}</span>
                        <span className="text-[11px] text-mt-text-secondary">{p.sku} - {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(p.salePrice || 0)}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => addQuoteLine(p.id)}><PlusCircle size={16} /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              {quoteForm.lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-center bg-mt-surface p-2 rounded border border-mt-border">
                  <div className="flex-1 text-sm font-medium">{line.description}</div>
                  <Input type="number" className="w-20" value={line.quantity} onChange={e => updateQuoteLine(i, { quantity: Number(e.target.value) })} min={1} />
                  <Input type="number" className="w-28" value={line.unitPrice} onChange={e => updateQuoteLine(i, { unitPrice: Number(e.target.value) })} step="0.01" />
                  <div className="w-28 text-right font-semibold text-emerald-400">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(line.amount)}</div>
                  <Button variant="ghost" size="sm" onClick={() => removeQuoteLine(i)} className="text-rose-400"><Trash2 size={16}/></Button>
                </div>
              ))}
              {quoteForm.lines.length === 0 && <div className="text-sm text-mt-text-muted text-center py-4">Agrega productos a la cotización</div>}
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div className="flex-1 mr-6"></div>
            <div className="w-48 text-right bg-mt-surface p-3 rounded-lg border border-mt-border">
              <div className="flex justify-between text-xs text-mt-text-secondary mb-1"><span>Subtotal:</span> <span>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(quoteForm.lines.reduce((a, l) => a + l.amount, 0))}</span></div>
              <div className="flex justify-between text-xs text-mt-text-secondary mb-2"><span>IVA (16%):</span> <span>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(quoteForm.lines.reduce((a, l) => a + l.amount, 0) * 0.16)}</span></div>
              <div className="flex justify-between text-sm font-bold border-t border-mt-border pt-2"><span>Total:</span> <span className="text-emerald-400">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(quoteForm.lines.reduce((a, l) => a + l.amount, 0) * 1.16)}</span></div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-2 pt-4 border-t border-mt-border">
            <Button variant="ghost" onClick={() => setQuoteModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveQuote} disabled={!quoteForm.clientId || quoteForm.lines.length === 0} className="flex-1">Guardar Cotización</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={requestModalOpen} onClose={() => setRequestModalOpen(false)} title={editingRequestId ? 'Editar solicitud' : 'Nueva solicitud'} width="450px">
        <div className="flex flex-col gap-4">
          <div><label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Producto solicitado</label><Input type="text" value={reqForm.description} onChange={e => setReqForm({...reqForm, description: e.target.value})} placeholder="Ej. Cámara de seguridad Hikvision 4MP" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Marca / Modelo</label><Input type="text" value={reqForm.brandModel} onChange={e => setReqForm({...reqForm, brandModel: e.target.value})} placeholder="Marca o modelo" /></div>
            <div><label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Cantidad</label><Input type="number" value={reqForm.quantity} onChange={e => setReqForm({...reqForm, quantity: Number(e.target.value)})} min={1} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Cliente Relacionado</label>
              <Select value={reqForm.clientId} onValueChange={v => setReqForm({...reqForm, clientId: v})}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Estado</label>
              <Select value={reqForm.status} onValueChange={v => setReqForm({...reqForm, status: v as ProductRequestStatus})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['PENDIENTE', 'EN PROCESO', 'RESUELTA', 'CERRADA'] as ProductRequestStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="ghost" onClick={() => setRequestModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button variant="primary" onClick={saveRequest} disabled={!reqForm.description} className="flex-1">Guardar</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
