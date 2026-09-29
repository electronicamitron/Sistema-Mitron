import { useState, useRef, useMemo } from 'react';
import { Button, Modal } from '@mitron/ui';
import { DataTable } from '../components/ui/DataTable';
import { PriceCalculatorModal } from '../components/domain/PriceCalculatorModal';
import { SupplierDrawer } from '../components/domain/SupplierDrawer';
import { Upload, Calculator, UserRound, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { ColumnDef, CellContext } from '@tanstack/react-table';

export default function Administration() {
  const { incomes, expenses, addIncome, addExpense, addNotification } = useData();
  const [activeTab, setActiveTab] = useState<'ingresos' | 'gastos' | 'proveedores'>('ingresos');
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  
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
      { id: 'proveedores', label: 'Proveedores' }
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

  const parseXML = (xmlText: string, file: File) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      const parserError = xmlDoc.getElementsByTagName("parsererror");
      if (parserError.length > 0) {
        throw new Error("Archivo XML mal formado o corrupto.");
      }

      const comprobante = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0] || xmlDoc.getElementsByTagName("Comprobante")[0];
      if (!comprobante) {
        throw new Error("El archivo no es un comprobante CFDI válido. Falta el nodo <Comprobante>.");
      }

      const totalAttr = comprobante.getAttribute("Total");
      if (!totalAttr) {
        throw new Error("El CFDI no contiene el atributo obligatorio 'Total'.");
      }
      const total = parseFloat(totalAttr);

      const fechaAttr = comprobante.getAttribute("Fecha");
      if (!fechaAttr) {
        throw new Error("El CFDI no contiene el atributo obligatorio 'Fecha'.");
      }
      const fecha = fechaAttr.split('T')[0];
      
      let supplierName = "PROVEEDOR DESCONOCIDO";
      const emisor = xmlDoc.getElementsByTagName("cfdi:Emisor")[0] || xmlDoc.getElementsByTagName("Emisor")[0];
      if (!emisor) {
        throw new Error("El CFDI no contiene el nodo obligatorio <Emisor>.");
      }
      
      const rfcEmisor = emisor.getAttribute("Rfc");
      if (!rfcEmisor) {
        throw new Error("Falta el RFC del emisor en el archivo XML.");
      }
      
      supplierName = emisor.getAttribute("Nombre") || supplierName;
      
      const conceptos = xmlDoc.getElementsByTagName("cfdi:Concepto") || xmlDoc.getElementsByTagName("Concepto");
      if (conceptos.length === 0) {
        throw new Error("El CFDI no contiene conceptos facturados.");
      }

      if (total <= 0) {
        throw new Error("El CFDI indica un total de cero o inválido.");
      }

      setPreviewData({
        type: 'gastos',
        filename: file.name,
        fileType: 'XML CFDI',
        period: fecha,
        amount: total,
        records: conceptos.length || 1,
        warnings: supplierName === "PROVEEDOR DESCONOCIDO" ? ["No se encontró el nombre del emisor en el archivo."] : [],
        data: {
          date: fecha,
          supplier: supplierName,
          invoiceId: `XML-${Date.now().toString().slice(-4)}`,
          category: 'Importación',
          total: total,
          status: 'pendiente',
          createdAt: new Date().toISOString()
        }
      });
      
      if (expenses.some(e => e.supplier === supplierName && e.total === total && e.date === fecha)) {
        setPreviewData((prev: any) => ({ ...prev, warnings: [...prev.warnings, "Posible duplicado: Ya existe un gasto idéntico registrado."] }));
      }
      setPreviewOpen(true);
    } catch (error: any) {
      addNotification({
        title: 'Error de importación XML',
        description: error.message || 'No se pudo leer el archivo XML',
        type: 'alert'
      });
    }
  };

  const parseTXT = (txtText: string, file: File) => {
    try {
      const lines = txtText.split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) {
        throw new Error("El archivo está vacío.");
      }
      
      const headerLine = lines[0].toUpperCase();
      if (!headerLine.includes('\t') && !headerLine.includes(',')) {
        throw new Error("El archivo no parece ser un TXT o CSV válido separado por comas o tabuladores.");
      }
      
      if (!headerLine.includes('CLAVE') && !headerLine.includes('FECHA') && !headerLine.includes('IMPORTE') && !headerLine.includes('TOTAL')) {
         throw new Error("No se detectaron las columnas esperadas (CLAVE, FECHA, IMPORTE o TOTAL).");
      }

      let start = false;
      let amount = 0;
      let count = 0;
      let detectedDate: string | null = null;
      const warnings: string[] = [];
      
      for (const line of lines) {
        if (line.toUpperCase().includes('CLAVE') || line.toUpperCase().includes('FECHA')) { 
          start = true; 
          continue; 
        }
        if (start && line.trim()) {
          const parts = line.split(/[\t,]/);
          if (parts.length >= 2) {
            if (!detectedDate) {
              const dateMatch = line.match(/\b(20\d{2}-\d{2}-\d{2}|\d{2}\/\d{2}\/20\d{2})\b/);
              if (dateMatch) {
                let d = dateMatch[0];
                if (d.includes('/')) {
                  const [day, month, year] = d.split('/');
                  d = `${year}-${month}-${day}`;
                }
                detectedDate = d;
              }
            }

            let importe = parseFloat(parts[parts.length - 1].replace(/[^0-9.-]+/g,""));
            if (isNaN(importe) && parts.length > 3) {
              for(let i = parts.length - 1; i >= 0; i--) {
                const val = parseFloat(parts[i].replace(/[^0-9.-]+/g,""));
                if (!isNaN(val)) {
                  importe = val;
                  break;
                }
              }
            }
            if (!isNaN(importe)) {
              amount += importe;
              count++;
            }
          }
        }
      }

      if (count === 0 || amount <= 0) {
        throw new Error("No se detectaron montos válidos asociados a los registros.");
      }

      // CORRECCIÓN: No asumir IVA del 16% sin confirmación de la regla de negocio
      const total = amount; 
      warnings.push("Pendiente de confirmar si el importe incluye IVA según las reglas del negocio. Mostrando valor extraído.");
      
      let baseDate = new Date();
      if (detectedDate) {
        baseDate = new Date(detectedDate + 'T12:00:00');
      } else {
        warnings.push("No se detectó ninguna fecha válida en el archivo. Se utilizará la fecha de hoy por defecto.");
      }
      
      const periodName = `${baseDate.toLocaleString('es-MX', { month: 'long' })} ${baseDate.getFullYear()}`;

      setPreviewData({
        type: 'ingresos',
        filename: file.name,
        fileType: 'Texto (TXT/CSV)',
        period: periodName,
        amount: amount, 
        total: total, 
        records: count,
        warnings: warnings,
        needsPeriodSelection: !detectedDate,
        data: {
          period: periodName,
          date: baseDate.toISOString().split('T')[0],
          filename: file.name,
          amount: amount,
          total: total,
          status: 'verificado',
          createdAt: new Date().toISOString()
        }
      });
      
      if (incomes.some(i => i.filename === file.name)) {
         setPreviewData((prev: any) => ({ ...prev, warnings: [...prev.warnings, "Posible duplicado: Ya se importó un reporte con el mismo nombre de archivo."] }));
      }
      setPreviewOpen(true);
    } catch (error: any) {
      addNotification({
        title: 'Error de importación TXT',
        description: error.message || 'El archivo no tiene el formato esperado.',
        type: 'alert'
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (activeTab === 'ingresos') {
        if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
          parseTXT(text, file);
        } else {
          addNotification({ title: 'Formato incorrecto', description: 'Sube un archivo TXT o CSV para ingresos.', type: 'warning' });
        }
      } else if (activeTab === 'gastos') {
        if (file.name.endsWith('.xml')) {
          parseXML(text, file);
        } else {
          addNotification({ title: 'Formato incorrecto', description: 'Sube un archivo XML para gastos.', type: 'warning' });
        }
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (!previewData) return;
    
    if (previewData.type === 'ingresos') {
      addIncome(previewData.data);
      addNotification({
        title: 'Reporte importado',
        description: `Se importó el archivo ${previewData.filename} con éxito.`,
        type: 'success'
      });
    } else {
      addExpense(previewData.data);
      addNotification({
        title: 'Factura importada',
        description: `Se importó la factura de ${previewData.data.supplier}.`,
        type: 'success'
      });
    }
    
    setPreviewOpen(false);
    setPreviewData(null);
  };

  const cancelImport = () => {
    setPreviewOpen(false);
    setPreviewData(null);
  };

  const incomesColumns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'period', header: 'Período', cell: (info: CellContext<any, any>) => <span className="font-medium">{info.getValue() as string}</span> },
    { accessorKey: 'filename', header: 'Archivo', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary">{info.getValue() as string}</span> },
    { accessorKey: 'amount', header: 'Importe', cell: (info: CellContext<any, any>) => formatCurrency(info.getValue() as number) },
    { accessorKey: 'total', header: 'Total c/IVA', cell: (info: CellContext<any, any>) => <span className="font-medium">{formatCurrency(info.getValue() as number)}</span> },
    { accessorKey: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
        const status = info.getValue() as string;
        const isOk = status === 'verificado';
        const isErr = status === 'error';
        return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${isOk ? 'bg-[#142818] border-[#1E4624] text-[#7CE38B]' : isErr ? 'bg-[#2F1517] border-[#542226] text-rose-400' : 'bg-mt-warning-bg border-mt-warning-border text-mt-warning-text'}`}>{status}</span>;
    }},
    { id: 'actions', header: 'Acciones', cell: () => (
      <Button variant="ghost" size="sm" onClick={() => setIsCalcOpen(true)} className="flex items-center gap-1.5">
        <Calculator size={14} /> Calcular precio
      </Button>
    )}
  ], []);

  const expensesColumns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'date', header: 'Fecha' },
    { accessorKey: 'supplier', header: 'Proveedor', cell: (info: CellContext<any, any>) => <span className="font-medium">{info.getValue() as string}</span> },
    { accessorKey: 'invoiceId', header: 'Factura', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary">{info.getValue() as string}</span> },
    { accessorKey: 'category', header: 'Clasificación', cell: (info: CellContext<any, any>) => <span className="bg-mt-surface-subtle px-2 py-0.5 rounded text-[11px]">{info.getValue() as string}</span> },
    { accessorKey: 'total', header: 'Total', cell: (info: CellContext<any, any>) => <span className="font-medium">{formatCurrency(info.getValue() as number)}</span> },
    { accessorKey: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
        const status = info.getValue() as string;
        const isPaid = status === 'pagado';
        const isPpd = status === 'ppd';
        return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${isPaid ? 'bg-[#142818] border-[#1E4624] text-[#7CE38B]' : isPpd ? 'bg-mt-warning-bg border-mt-warning-border text-mt-warning-text' : 'bg-[#2F1517] border-[#542226] text-rose-400'}`}>{status.toUpperCase()}</span>;
    }},
    { id: 'actions', header: 'Acciones', cell: () => (
      <Button variant="ghost" size="sm" onClick={() => setIsCalcOpen(true)} className="flex items-center gap-1.5">
        <Calculator size={14} /> Calcular precio
      </Button>
    )}
  ], []);

  const supplierColumns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'name', header: 'Proveedor', cell: (info: CellContext<any, any>) => <span className="font-medium">{info.getValue() as string}</span> },
    { accessorKey: 'rfc', header: 'RFC', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary">{info.getValue() as string}</span> },
    { accessorKey: 'total', header: 'Total Comprado', cell: (info: CellContext<any, any>) => <span className="font-medium">{info.getValue() as string}</span> },
    { accessorKey: 'lastDate', header: 'Última Compra' },
    { id: 'actions', header: 'Acciones', cell: () => (
      <Button variant="secondary" size="sm" onClick={() => setIsSupplierOpen(true)} className="flex items-center gap-1.5">
        <UserRound size={14} /> Ver Ficha
      </Button>
    )}
  ], []);

  const dummySuppliers = [{ name: 'PROVEEDOR EJEMPLO S.A. DE C.V.', rfc: 'EXA123456789', total: '$10,000.00', lastDate: '08/07/2026' }];

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Administración</h1>
            <p className="mt-page-subtitle text-sm text-mt-text-secondary">Gestiona los ingresos, gastos y directorio de proveedores.</p>
          </div>
          {(activeTab === 'ingresos' || activeTab === 'gastos') && (
            <div>
              <input type="file" ref={fileInputRef} className="hidden" accept={activeTab === 'ingresos' ? '.txt,.csv' : '.xml'} onChange={handleFileUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-mt-surface-subtle border border-mt-border px-4 py-2.5 rounded-lg cursor-pointer text-mt-text-primary transition-all font-medium hover:bg-mt-surface-hover hover:border-mt-text-muted"
              >
                <Upload size={16} />
                <span className="text-sm">Importar archivo {activeTab === 'ingresos' ? 'TXT' : 'XML'}</span>
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
            searchKey="filename" 
            searchPlaceholder="Buscar por archivo..." 
          />
        )}

        {activeTab === 'gastos' && (
          <DataTable 
            columns={expensesColumns} 
            data={expenses} 
            searchKey="supplier" 
            searchPlaceholder="Buscar por proveedor..." 
          />
        )}

        {activeTab === 'proveedores' && (
          <DataTable 
            columns={supplierColumns} 
            data={dummySuppliers} 
            searchKey="name" 
            searchPlaceholder="Buscar proveedor..." 
          />
        )}
      </div>

      <PriceCalculatorModal 
        isOpen={isCalcOpen} 
        onClose={() => setIsCalcOpen(false)} 
        itemName="Producto / Servicio" 
        cost={100} 
      />
      <SupplierDrawer 
        isOpen={isSupplierOpen} 
        onClose={() => setIsSupplierOpen(false)} 
        supplierName="PROVEEDOR EJEMPLO S.A. DE C.V." 
        rfc="EXA123456789" 
      />

      <Modal isOpen={previewOpen} onClose={cancelImport} title="Vista previa de importación" width="450px">
        {previewData && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-4 bg-mt-surface-subtle rounded-lg border border-mt-border">
              <FileText size={24} className="text-blue-400" />
              <div>
                <div className="text-sm font-semibold text-mt-text-primary">{previewData.filename}</div>
                <div className="text-xs text-mt-text-secondary">Tipo: {previewData.fileType}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-mt-surface p-3 rounded-lg border border-mt-border">
                <div className="text-[11px] text-mt-text-secondary mb-1">Período / Fecha</div>
                {previewData.needsPeriodSelection || previewData.type === 'ingresos' ? (
                  <input 
                    type="date" 
                    value={previewData.data.date} 
                    onChange={e => {
                      const newDate = new Date(e.target.value + 'T12:00:00');
                      const p = `${newDate.toLocaleString('es-MX', { month: 'long' })} ${newDate.getFullYear()}`;
                      setPreviewData((prev: any) => ({
                        ...prev, period: p, data: { ...prev.data, date: e.target.value, period: p }
                      }));
                    }}
                    className="w-full bg-transparent border-none text-mt-text-primary text-sm outline-none font-sans"
                  />
                ) : (
                  <div className="text-sm font-medium text-mt-text-primary">{previewData.period}</div>
                )}
              </div>
              <div className="bg-mt-surface p-3 rounded-lg border border-mt-border">
                <div className="text-[11px] text-mt-text-secondary mb-1">Registros</div>
                <div className="text-sm font-medium text-mt-text-primary">{previewData.records} detectados</div>
              </div>
            </div>

            <div className="bg-mt-surface p-4 rounded-lg border border-mt-border text-center">
              <div className="text-xs text-mt-text-secondary mb-1">Total reconocido</div>
              <div className={`text-2xl font-bold ${previewData.type === 'ingresos' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {previewData.total ? formatCurrency(previewData.total) : formatCurrency(previewData.amount)}
              </div>
            </div>

            {previewData.warnings && previewData.warnings.length > 0 && (
              <div className="bg-amber-400/10 border border-amber-400/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-[13px] mb-2">
                  <AlertTriangle size={16} />
                  Advertencias
                </div>
                <ul className="m-0 pl-5 text-xs text-mt-text-secondary list-disc">
                  {previewData.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

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
