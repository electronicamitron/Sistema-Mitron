import { useState, useRef, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Modal } from '@mitron/ui';
import { DataTable } from '../components/ui/DataTable';
import { SupplierDrawer } from '../components/domain/SupplierDrawer';
import { InvoiceDrawer } from '../components/domain/InvoiceDrawer';
import { Upload, UserRound, FileText, CheckCircle, FileSearch, Trash2, Download } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { ColumnDef, CellContext } from '@tanstack/react-table';
import Precios from './Precios';
import { parseCfdi, parseSalesReport } from '../lib/parsers';
import { formatDateHuman } from '../lib/utils';

export default function Administration() {
  const { incomes, expenses, addIncome, deleteIncome, addExpense, deleteExpense, addNotification, suppliers } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'ingresos' | 'gastos' | 'proveedores' | 'precios'>('ingresos');
  
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab as any);
      // Clean up state so we don't keep returning to the same tab on refresh
      navigate(location.pathname, { replace: true, state: { ...location.state, tab: undefined } });
    }
  }, [location, navigate]);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [selectedSupplierRfc, setSelectedSupplierRfc] = useState<string>('');
  
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const renderTabs = () => {
    const tabs = [
      { id: 'ingresos', label: 'Ingresos' },
      { id: 'gastos', label: 'Gastos' },
      { id: 'proveedores', label: 'Proveedores' },
      { id: 'precios', label: 'Precios' }
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
    
    // Accept one required file and one optional PDF if selected together
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
          period: report.periodStart,
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
          period: purchase.date,
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
    // Just mock downloading by opening a new tab to the generic test-data location or show a toast
    // In a real app we'd trigger a blob download from indexedDB
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

  const incomesColumns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'periodStart', header: 'Período', cell: (info: CellContext<any, any>) => <span className="font-medium">{info.getValue() as string}</span> },
    { accessorKey: 'txtFileRef', header: 'Reporte', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary">{info.getValue() as string}</span> },
    { accessorKey: 'total', header: 'Total', cell: (info: CellContext<any, any>) => <span className="font-medium">{formatCurrency(info.getValue() as number)}</span> },
    { id: 'status', header: 'Estado', cell: () => <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">PROCESADA</span> },
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => {
      const row = info.row.original;
      return (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => downloadFile(row.txtFileRef)} title="Descargar TXT">
            <Download size={14} /> TXT
          </Button>
          {row.pdfFileRef && (
            <Button variant="ghost" size="sm" onClick={() => downloadFile(row.pdfFileRef)} title="Descargar PDF">
              <Download size={14} /> PDF
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => deleteDoc(row.id, 'ingresos')} className="text-rose-400 hover:text-rose-300">
            <Trash2 size={14} />
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
             XML
          </Button>
          {row.pdfFileRef && (
            <Button variant="ghost" size="sm" onClick={() => downloadFile(row.pdfFileRef)} title="Descargar PDF">
               PDF
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => deleteDoc(row.id, 'gastos')} className="text-rose-400 hover:text-rose-300">
            <Trash2 size={14} />
          </Button>
        </div>
      );
    }}
  ], []);

  const supplierColumns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'name', header: 'Proveedor', cell: (info: CellContext<any, any>) => <span className="font-medium">{info.getValue() as string}</span> },
    { accessorKey: 'rfc', header: 'RFC', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary">{info.getValue() as string}</span> },
    { id: 'facturas', header: 'Facturas', cell: (info: CellContext<any, any>) => {
      const supplierExpenses = expenses.filter(e => e.supplierRfc === info.row.original.rfc);
      return <span className="text-mt-text-primary">{supplierExpenses.length}</span>;
    }},
    { id: 'total', header: 'Total comprado', cell: (info: CellContext<any, any>) => {
      const supplierExpenses = expenses.filter(e => e.supplierRfc === info.row.original.rfc);
      const total = supplierExpenses.reduce((sum, e) => sum + e.total, 0);
      return <span className="font-medium">{formatCurrency(total)}</span>;
    }},
    { id: 'lastPurchase', header: 'Última compra', cell: (info: CellContext<any, any>) => {
      const supplierExpenses = expenses.filter(e => e.supplierRfc === info.row.original.rfc).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (supplierExpenses.length === 0) return <span className="text-mt-text-muted">Ninguna</span>;
      return <span className="text-mt-text-secondary">{formatDateHuman(supplierExpenses[0].date)}</span>;
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => (
      <Button variant="secondary" size="sm" onClick={() => { setSelectedSupplierRfc(info.row.original.rfc); setIsSupplierOpen(true); }} className="flex items-center gap-1.5">
        <UserRound size={14} /> Ver Ficha
      </Button>
    )}
  ], [expenses]);

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Administración</h1>
            <p className="mt-page-subtitle text-sm text-mt-text-secondary">Gestiona los ingresos, gastos y directorio de proveedores.</p>
          </div>
          {(activeTab === 'ingresos' || activeTab === 'gastos') && (
            <div className="flex gap-3">
              <input type="file" multiple ref={fileInputRef} className="hidden" accept={activeTab === 'ingresos' ? '.txt,.csv,.pdf' : '.xml,.pdf'} onChange={handleFileUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-mt-surface-subtle border border-mt-border px-4 py-2.5 rounded-lg cursor-pointer text-mt-text-primary transition-all font-medium hover:bg-mt-surface-hover hover:border-mt-text-muted"
              >
                <Upload size={16} />
                <span className="text-sm">{activeTab === 'ingresos' ? 'Importar TXT/PDF' : 'Importar XML/PDF'}</span>
              </button>
            </div>
          )}
        </div>
        {renderTabs()}
      </div>

      <div className="animate-fade-in">
        {activeTab === 'ingresos' && (
          <DataTable 
            columns={incomesColumns} 
            data={incomes} 
            searchKey="txtFileRef" 
            searchPlaceholder="Buscar por archivo..." 
          />
        )}

        {activeTab === 'gastos' && (
          <DataTable 
            columns={expensesColumns} 
            data={expenses} 
            searchKey="supplierName" 
            searchPlaceholder="Buscar por proveedor..." 
          />
        )}

        {activeTab === 'proveedores' && (
          <DataTable 
            columns={supplierColumns} 
            data={suppliers} 
            searchKey="name" 
            searchPlaceholder="Buscar proveedor..." 
          />
        )}

        {activeTab === 'precios' && (
          <Precios />
        )}
      </div>

      <SupplierDrawer 
        isOpen={isSupplierOpen} 
        onClose={() => setIsSupplierOpen(false)} 
        rfc={selectedSupplierRfc} 
      />

      <InvoiceDrawer 
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={selectedInvoice}
      />

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
    </div>
  );
}
