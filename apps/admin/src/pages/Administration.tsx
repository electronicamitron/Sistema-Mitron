import { useState, useRef, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Modal, Input } from '@mitron/ui';
import { DataTable } from '../components/ui/DataTable';
import { SupplierDrawer } from '../components/domain/SupplierDrawer';
import { InvoiceDrawer } from '../components/domain/InvoiceDrawer';
import { IncomeDrawer } from '../components/domain/IncomeDrawer';
import { Upload, FileText, CheckCircle, FileSearch, CreditCard, Pencil, UserRound } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { ColumnDef, CellContext } from '@tanstack/react-table';
import type { PaymentStatus, PaymentRecord } from '../types/purchase';
import Precios from './Precios';
import { parseCfdi, parseSalesReport } from '../lib/parsers';
import { formatDateHuman, formatPeriod } from '../lib/utils';
import type { SalesReport } from '../types/sales';

export default function Administration() {
  const { incomes, expenses, addIncome, deleteIncome, addExpense, deleteExpense, updateExpense, addNotification, suppliers, updateSupplier } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'ingresos' | 'gastos' | 'proveedores' | 'precios' | 'cuentas'>('ingresos');
  
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab as any);
      navigate(location.pathname, { replace: true, state: { ...location.state, tab: undefined } });
    }
  }, [location, navigate]);

  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [selectedSupplierRfc, setSelectedSupplierRfc] = useState<string>('');
  
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<SalesReport | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');

  // Supplier edit modal
  const [supplierEditOpen, setSupplierEditOpen] = useState(false);
  const [editSupplierRfc, setEditSupplierRfc] = useState<string>('');
  const [editContactName, setEditContactName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLeadTime, setEditLeadTime] = useState<number>(0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const renderTabs = () => {
    const tabs = [
      { id: 'ingresos', label: 'Ingresos' },
      { id: 'gastos', label: 'Compras y gastos' },
      { id: 'proveedores', label: 'Proveedores' },
      { id: 'precios', label: 'Precios' },
      { id: 'cuentas', label: 'Cuentas por pagar' },
    ] as const;

    return (
      <div className="flex gap-6 mt-6 border-b border-mt-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`bg-transparent border-none text-sm cursor-pointer pb-3 transition-all -mb-[1px] ${activeTab === tab.id ? 'text-mt-text-primary font-semibold border-b-2 border-mt-text-primary' : 'text-mt-text-secondary font-medium border-b-2 border-transparent'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    let xmlFile = files.find(f => f.name.endsWith('.xml'));
    let txtFile = files.find(f => f.name.endsWith('.txt') || f.name.endsWith('.csv'));
    let pdfFile = files.find(f => f.name.endsWith('.pdf'));

    if (activeTab === 'ingresos') {
      if (!txtFile) {
        addNotification({ title: 'Falta reporte', description: 'Debes seleccionar un archivo TXT de ventas.', type: 'warning' });
        return;
      }
      try {
        const textBuffer = await txtFile.arrayBuffer();
        const decoder = new TextDecoder('windows-1252');
        const txtText = decoder.decode(textBuffer);
        const report = parseSalesReport(txtText, txtFile.name, pdfFile?.name);
        
        setPreviewData({
          type: 'ingresos',
          filename: txtFile.name,
          fileType: 'Reporte de Ventas (TXT)',
          period: formatPeriod(report.periodStart, report.periodEnd),
          amount: report.total,
          records: report.lines.length,
          data: report,
          pdf: pdfFile?.name
        });
        setPreviewOpen(true);
      } catch (err: any) {
        addNotification({ title: 'Error de parser', description: err.message, type: 'alert' });
      }
      
    } else if (activeTab === 'gastos') {
      if (!xmlFile) {
        addNotification({ title: 'Falta factura', description: 'Debes seleccionar un archivo XML CFDI.', type: 'warning' });
        return;
      }
      try {
        const xmlText = await xmlFile.text();
        const purchase = parseCfdi(xmlText, xmlFile.name, pdfFile?.name);
        
        if (expenses.some(e => e.uuid && e.uuid === purchase.uuid)) {
          throw new Error('Esta factura ya fue importada.');
        }

        setPreviewData({
          type: 'gastos',
          filename: xmlFile.name,
          fileType: 'Factura XML CFDI 4.0',
          period: formatDateHuman(purchase.date, true),
          amount: purchase.total,
          records: purchase.lines.length,
          data: purchase,
          pdf: pdfFile?.name
        });
        setPreviewOpen(true);
      } catch (err: any) {
        addNotification({ title: 'Error de parser', description: err.message, type: 'alert' });
      }
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmImport = () => {
    if (!previewData) return;
    
    if (previewData.type === 'ingresos') {
      addIncome(previewData.data);
      addNotification({ title: 'Reporte importado', description: `Se importó el archivo ${previewData.filename} con éxito.`, type: 'success' });
    } else {
      addExpense(previewData.data);
      addNotification({ title: 'Factura importada', description: `Se importó la factura de ${previewData.data.supplierName}.`, type: 'success' });
    }
    setPreviewOpen(false);
    setPreviewData(null);
  };

  const cancelImport = () => {
    setPreviewOpen(false);
    setPreviewData(null);
  };

  const downloadFile = (fileName: string) => {
    if (!fileName) return;
    addNotification({ title: 'Descarga iniciada', description: `Descargando ${fileName}...`, type: 'info' });
  };

  const deleteDoc = (id: string, type: 'gastos' | 'ingresos') => {
    const msg = type === 'ingresos' 
      ? '¿Eliminar este reporte?\n\nSe eliminarán los movimientos derivados de este documento.' 
      : '¿Eliminar esta factura?\n\nSe eliminarán también los movimientos de inventario y datos derivados exclusivamente de este documento.';
    
    if (confirm(msg)) {
      if (type === 'gastos') deleteExpense(id);
      if (type === 'ingresos') deleteIncome(id);
      addNotification({ title: 'Documento eliminado', description: 'El documento fue eliminado y el inventario recalculado.', type: 'info' });
    }
  };

  const openPaymentModal = (invoiceId: string) => {
    const inv = expenses.find(e => e.id === invoiceId);
    if (!inv) return;
    setPaymentInvoiceId(invoiceId);
    setPaymentAmount(0);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentReference('');
    setPaymentModalOpen(true);
  };

  const savePayment = () => {
    const inv = expenses.find(e => e.id === paymentInvoiceId);
    if (!inv) return;
    
    const newPayment: PaymentRecord = {
      id: Date.now().toString(),
      invoiceId: paymentInvoiceId,
      amount: paymentAmount,
      date: paymentDate,
      reference: paymentReference
    };
    
    updateExpense(paymentInvoiceId, {
      payments: [...(inv.payments || []), newPayment]
    });
    addNotification({ title: 'Pago registrado', description: 'Se guardó el pago correctamente.', type: 'success' });
    setPaymentModalOpen(false);
  };

  const openSupplierEdit = (rfc: string) => {
    const sup = suppliers.find(s => s.rfc === rfc);
    if (!sup) return;
    setEditSupplierRfc(rfc);
    setEditContactName(sup.contactName || '');
    setEditPhone(sup.phone || '');
    setEditEmail(sup.email || '');
    setEditLeadTime(sup.leadTimeDays || 0);
    setSupplierEditOpen(true);
  };

  const saveSupplierEdit = () => {
    updateSupplier(editSupplierRfc, {
      contactName: editContactName || undefined,
      phone: editPhone || undefined,
      email: editEmail || undefined,
      leadTimeDays: editLeadTime || undefined,
    });
    addNotification({ title: 'Proveedor actualizado', description: 'Se guardaron los datos de contacto.', type: 'success' });
    setSupplierEditOpen(false);
  };

  const incomesColumns: ColumnDef<any, any>[] = useMemo(() => [
    { id: 'period', header: 'Período', cell: (info: CellContext<any, any>) => <span className="font-medium">{formatPeriod(info.row.original.periodStart, info.row.original.periodEnd)}</span> },
    { accessorKey: 'txtFileRef', header: 'Reporte', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary">{info.getValue() as string}</span> },
    { accessorKey: 'total', header: 'Total', cell: (info: CellContext<any, any>) => <span className="font-medium">{formatCurrency(info.getValue() as number)}</span> },
    { id: 'status', header: 'Estado', cell: () => <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">PROCESADA</span> },
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => {
      const row = info.row.original;
      return (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setSelectedIncome(row); setIsIncomeOpen(true); }}>
            <FileSearch size={14} /> Detalle
          </Button>
          <Button variant="ghost" size="sm" onClick={() => downloadFile(row.txtFileRef)} title="Descargar TXT">
            Descargar TXT
          </Button>
          {row.pdfFileRef && (
            <Button variant="ghost" size="sm" onClick={() => downloadFile(row.pdfFileRef)} title="Descargar PDF">
              Descargar PDF
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => deleteDoc(row.id, 'ingresos')} className="text-rose-400 hover:text-rose-300">
            Eliminar
          </Button>
        </div>
      );
    }}
  ], []);

  const expensesColumns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'date', header: 'Fecha', cell: (info: CellContext<any, any>) => formatDateHuman(info.getValue() as string) },
    { accessorKey: 'supplierName', header: 'Proveedor', cell: (info: CellContext<any, any>) => <span className="font-medium">{info.getValue() as string}</span> },
    { accessorKey: 'uuid', header: 'Factura', cell: (info: CellContext<any, any>) => {
        const row = info.row.original;
        const id = row.uuid ? row.uuid.split('-')[0] : (row.serie + row.folio || 'S/N');
        return <span className="text-mt-text-secondary">{id}</span>
    }},
    { accessorKey: 'total', header: 'Total', cell: (info: CellContext<any, any>) => <span className="font-medium">{formatCurrency(info.getValue() as number)}</span> },
    { id: 'status', header: 'Estado', cell: () => <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">PROCESADA</span> },
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => {
      const row = info.row.original;
      return (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setSelectedInvoice(row); setIsInvoiceOpen(true); }}>
            <FileSearch size={14} /> Detalle
          </Button>
          <Button variant="ghost" size="sm" onClick={() => downloadFile(row.xmlFileRef)} title="Descargar XML">
             Descargar XML
          </Button>
          {row.pdfFileRef && (
            <Button variant="ghost" size="sm" onClick={() => downloadFile(row.pdfFileRef)} title="Descargar PDF">
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => deleteDoc(row.id, 'gastos')} className="text-rose-400 hover:text-rose-300">
            Eliminar
          </Button>
        </div>
      );
    }}
  ], []);

  const supplierColumns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'name', header: 'Proveedor', cell: (info: CellContext<any, any>) => <span className="font-medium">{info.getValue() as string}</span> },
    { accessorKey: 'rfc', header: 'RFC', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary">{info.getValue() as string}</span> },
    { id: 'contactName', header: 'Contacto', cell: (info: CellContext<any, any>) => {
      const s = info.row.original;
      return <span className="text-mt-text-secondary text-sm">{s.contactName || '—'}</span>;
    }},
    { id: 'facturas', header: 'Facturas', cell: (info: CellContext<any, any>) => {
      const supplierExpenses = expenses.filter(e => e.supplierRfc === info.row.original.rfc);
      return <span className="text-mt-text-primary">{supplierExpenses.length}</span>;
    }},
    { id: 'total', header: 'Total comprado', cell: (info: CellContext<any, any>) => {
      const supplierExpenses = expenses.filter(e => e.supplierRfc === info.row.original.rfc);
      const total = supplierExpenses.reduce((sum, e) => sum + e.total, 0);
      return <span className="font-medium">{formatCurrency(total)}</span>;
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => (
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => { setSelectedSupplierRfc(info.row.original.rfc); setIsSupplierOpen(true); }} className="flex items-center gap-1.5">
          <UserRound size={14} /> Ficha
        </Button>
        <Button variant="ghost" size="sm" onClick={() => openSupplierEdit(info.row.original.rfc)} className="flex items-center gap-1.5">
          <Pencil size={14} />
        </Button>
      </div>
    )}
  ], [expenses]);

  // Accounts payable
  const accountsData = useMemo(() => {
    return expenses.map(e => {
      const paid = e.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
      const remaining = e.total - paid;
      
      let derivedStatus: PaymentStatus = 'PENDIENTE';
      if (remaining <= 0) derivedStatus = 'PAGADA';
      else if (e.dueDate && new Date(e.dueDate) < new Date()) derivedStatus = 'VENCIDA';
      else if (paid > 0) derivedStatus = 'PARCIAL';

      return {
        ...e,
        paid,
        remaining,
        status: derivedStatus,
      };
    });
  }, [expenses]);

  const accountsColumns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'supplierName', header: 'Proveedor', cell: (info: CellContext<any, any>) => <span className="font-medium text-sm">{info.getValue() as string}</span> },
    { id: 'invoice', header: 'Factura', cell: (info: CellContext<any, any>) => {
      const row = info.row.original;
      return <span className="text-mt-text-secondary text-xs font-mono">{row.serie || ''}{row.folio || ''}</span>;
    }},
    { accessorKey: 'date', header: 'Fecha', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary text-sm">{formatDateHuman(info.getValue() as string)}</span> },
    { id: 'dueDate', header: 'Vencimiento', cell: (info: CellContext<any, any>) => {
      const row = info.row.original;
      if (!row.dueDate) return <span className="text-mt-text-muted text-sm">Sin vencimiento</span>;
      const due = new Date(row.dueDate);
      const isOverdue = due < new Date() && row.remaining > 0;
      return <span className={`text-sm ${isOverdue ? 'text-rose-400 font-semibold' : 'text-mt-text-secondary'}`}>{formatDateHuman(row.dueDate)}</span>;
    }},
    { accessorKey: 'total', header: 'Total', cell: (info: CellContext<any, any>) => <span className="font-medium text-sm">{formatCurrency(info.getValue() as number)}</span> },
    { id: 'paid', header: 'Pagado', cell: (info: CellContext<any, any>) => <span className="text-emerald-400 text-sm">{formatCurrency(info.row.original.paid)}</span> },
    { id: 'remaining', header: 'Pendiente', cell: (info: CellContext<any, any>) => {
      const r = info.row.original.remaining;
      return <span className={`text-sm font-medium ${r > 0 ? 'text-amber-400' : 'text-mt-text-muted'}`}>{formatCurrency(r)}</span>;
    }},
    { id: 'paymentStatus', header: 'Estado', cell: (info: CellContext<any, any>) => {
      const st = info.row.original.status as PaymentStatus;
      const colors: Record<PaymentStatus, string> = {
        'PENDIENTE': 'bg-amber-500/10 text-amber-400',
        'PARCIAL': 'bg-blue-500/10 text-blue-400',
        'PAGADA': 'bg-emerald-500/10 text-emerald-400',
        'VENCIDA': 'bg-rose-500/10 text-rose-400',
      };
      return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[st] || 'bg-mt-surface-subtle text-mt-text-muted'}`}>{st}</span>;
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => (
      <Button variant="secondary" size="sm" onClick={() => openPaymentModal(info.row.original.id)} className="flex items-center gap-1.5 w-full justify-center">
        <CreditCard size={14} /> {info.row.original.remaining > 0 ? 'Abonar' : 'Historial'}
      </Button>
    )}
  ], []);

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Administración</h1>
            <p className="mt-page-subtitle text-sm text-mt-text-secondary">Gestión financiera, compras, proveedores y precios.</p>
          </div>
          {(activeTab === 'ingresos' || activeTab === 'gastos') && (
            <div className="flex gap-3">
              <input type="file" multiple ref={fileInputRef} className="hidden" accept={activeTab === 'ingresos' ? '.txt,.csv,.pdf' : '.xml,.pdf'} onChange={handleFileUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-mt-surface-subtle border border-mt-border px-4 py-2.5 rounded-lg cursor-pointer text-mt-text-primary transition-all font-medium hover:bg-mt-surface-hover hover:border-mt-text-muted"
              >
                <Upload size={16} />
                <span className="text-sm">{activeTab === 'ingresos' ? 'Importar TXT' : 'Importar XML'}</span>
              </button>
            </div>
          )}
        </div>
        {renderTabs()}
      </div>

      <div className="animate-fade-in">
        {activeTab === 'ingresos' && (
          <DataTable columns={incomesColumns} data={incomes} searchKey="txtFileRef" searchPlaceholder="Buscar por archivo..." />
        )}
        {activeTab === 'gastos' && (
          <DataTable columns={expensesColumns} data={expenses} searchKey="supplierName" searchPlaceholder="Buscar por proveedor..." />
        )}
        {activeTab === 'proveedores' && (
          <DataTable columns={supplierColumns} data={suppliers} searchKey="name" searchPlaceholder="Buscar proveedor..." />
        )}
        {activeTab === 'precios' && <Precios />}
        {activeTab === 'cuentas' && (
          <DataTable columns={accountsColumns} data={accountsData} searchKey="supplierName" searchPlaceholder="Buscar por proveedor..." />
        )}
      </div>

      <SupplierDrawer isOpen={isSupplierOpen} onClose={() => setIsSupplierOpen(false)} rfc={selectedSupplierRfc} onEdit={() => { setIsSupplierOpen(false); openSupplierEdit(selectedSupplierRfc); }} />
      <InvoiceDrawer isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} invoice={selectedInvoice} />

      {/* Import Preview Modal */}
      <Modal isOpen={previewOpen} onClose={cancelImport} title="Vista previa de importación" width="450px">
        {previewData && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-4 bg-mt-surface-subtle rounded-lg border border-mt-border">
              <FileText size={24} className="text-blue-400" />
              <div>
                <div className="text-sm font-semibold text-mt-text-primary">{previewData.filename}</div>
                <div className="text-xs text-mt-text-secondary">Tipo: {previewData.fileType}</div>
                {previewData.pdf && <div className="text-xs text-mt-text-secondary">PDF Adjunto: {previewData.pdf}</div>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-mt-surface p-3 rounded-lg border border-mt-border">
                <div className="text-[11px] text-mt-text-secondary mb-1">Período / Fecha</div>
                <div className="text-sm font-medium text-mt-text-primary">{previewData.period}</div>
              </div>
              <div className="bg-mt-surface p-3 rounded-lg border border-mt-border">
                <div className="text-[11px] text-mt-text-secondary mb-1">Registros</div>
                <div className="text-sm font-medium text-mt-text-primary">{previewData.records} detectados</div>
              </div>
            </div>
            <div className="bg-mt-surface p-4 rounded-lg border border-mt-border text-center">
              <div className="text-xs text-mt-text-secondary mb-1">Total reconocido</div>
              <div className={`text-2xl font-bold ${previewData.type === 'ingresos' ? 'text-emerald-400' : 'text-blue-400'}`}>
                {formatCurrency(previewData.amount)}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="ghost" size="md" onClick={cancelImport} className="flex-1">Cancelar</Button>
              <Button variant="primary" size="md" onClick={confirmImport} className="flex-1 gap-2">
                <CheckCircle size={16} /> Confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Agregar Pago" width="450px">
        {(() => {
          const inv = expenses.find(e => e.id === paymentInvoiceId);
          if (!inv) return null;
          const pagado = inv.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
          const pendiente = inv.total - pagado;
          return (
            <div className="flex flex-col gap-4">
              <div className="bg-mt-surface-subtle p-3 rounded-lg border border-mt-border">
                <div className="text-sm font-semibold text-mt-text-primary">{inv.supplierName}</div>
                <div className="flex justify-between text-xs text-mt-text-secondary mt-1">
                  <span>Total: {formatCurrency(inv.total)}</span>
                  <span>Pagado: <span className="text-emerald-400">{formatCurrency(pagado)}</span></span>
                  <span>Pendiente: <span className="text-amber-400">{formatCurrency(pendiente)}</span></span>
                </div>
              </div>
              
              {inv.payments && inv.payments.length > 0 && (
                <div className="border border-mt-border rounded-lg bg-mt-surface-subtle overflow-hidden">
                  <div className="text-xs font-semibold px-3 py-2 border-b border-mt-border bg-mt-surface">Pagos Anteriores</div>
                  {inv.payments.map(p => (
                    <div key={p.id} className="flex justify-between px-3 py-2 text-[13px] border-b border-mt-border last:border-none">
                      <span className="text-mt-text-secondary">{formatDateHuman(p.date)} {p.reference && <span className="text-xs opacity-50">({p.reference})</span>}</span>
                      <span className="font-semibold text-emerald-400">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Monto a pagar</label>
                  <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} min={0.01} max={pendiente} step={0.01} />
                </div>
                <div>
                  <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Fecha</label>
                  <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Referencia (Opcional)</label>
                <Input type="text" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder="Ej. Transf 1234" />
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="ghost" size="md" onClick={() => setPaymentModalOpen(false)} className="flex-1">Cancelar</Button>
                <Button variant="primary" size="md" onClick={savePayment} disabled={paymentAmount <= 0 || paymentAmount > pendiente} className="flex-1 gap-2">
                  <CheckCircle size={16} /> Guardar
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Supplier Edit Modal */}
      <Modal isOpen={supplierEditOpen} onClose={() => setSupplierEditOpen(false)} title="Editar proveedor" width="420px">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Contacto</label>
            <Input type="text" value={editContactName} onChange={e => setEditContactName(e.target.value)} placeholder="Nombre del contacto" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Teléfono</label>
              <Input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Tel." />
            </div>
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Correo</label>
              <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" />
            </div>
          </div>
          <div>
            <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Tiempo de entrega (días)</label>
            <Input type="number" value={editLeadTime} onChange={e => setEditLeadTime(Number(e.target.value))} min={0} />
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="ghost" size="md" onClick={() => setSupplierEditOpen(false)} className="flex-1">Cancelar</Button>
            <Button variant="primary" size="md" onClick={saveSupplierEdit} className="flex-1 gap-2">
              <CheckCircle size={16} /> Guardar
            </Button>
          </div>
        </div>
      </Modal>
      <IncomeDrawer isOpen={isIncomeOpen} onClose={() => setIsIncomeOpen(false)} income={selectedIncome} />
    </div>
  );
}
