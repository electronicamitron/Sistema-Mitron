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
      <div style={{ display: 'flex', gap: '24px', marginTop: '24px', borderBottom: '1px solid var(--mt-border)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === tab.id ? 'var(--mt-text-primary)' : 'var(--mt-text-secondary)',
              fontWeight: activeTab === tab.id ? 600 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              padding: '0 0 12px 0',
              borderBottom: activeTab === tab.id ? '2px solid var(--mt-text-primary)' : '2px solid transparent',
              transition: 'all 0.2s',
              marginBottom: '-1px'
            }}
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
            // Attempt to find a date in the format YYYY-MM-DD or DD/MM/YYYY
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
              // try to find the first numeric value from the end
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

      const total = amount * 1.16; // Add IVA
      
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
    
    // Reset
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
    { accessorKey: 'period', header: 'Período', cell: (info: CellContext<any, any>) => <span style={{ fontWeight: 500 }}>{info.getValue() as string}</span> },
    { accessorKey: 'filename', header: 'Archivo', cell: (info: CellContext<any, any>) => <span style={{ color: 'var(--mt-text-secondary)' }}>{info.getValue() as string}</span> },
    { accessorKey: 'amount', header: 'Importe', cell: (info: CellContext<any, any>) => formatCurrency(info.getValue() as number) },
    { accessorKey: 'total', header: 'Total c/IVA', cell: (info: CellContext<any, any>) => <span style={{ fontWeight: 500 }}>{formatCurrency(info.getValue() as number)}</span> },
    { accessorKey: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
        const status = info.getValue() as string;
        const isOk = status === 'verificado';
        const isErr = status === 'error';
        return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, backgroundColor: isOk ? '#142818' : isErr ? '#2F1517' : 'var(--mt-warning-bg)', border: `1px solid ${isOk ? '#1E4624' : isErr ? '#542226' : 'var(--mt-warning-border)'}`, color: isOk ? '#7CE38B' : isErr ? '#F87171' : 'var(--mt-warning-text)' }}>{status}</span>;
    }},
    { id: 'actions', header: 'Acciones', cell: () => (
      <Button variant="ghost" size="sm" onClick={() => setIsCalcOpen(true)} className="flex items-center gap-1.5">
        <Calculator size={14} /> Calcular precio
      </Button>
    )}
  ], []);

  const expensesColumns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'date', header: 'Fecha' },
    { accessorKey: 'supplier', header: 'Proveedor', cell: (info: CellContext<any, any>) => <span style={{ fontWeight: 500 }}>{info.getValue() as string}</span> },
    { accessorKey: 'invoiceId', header: 'Factura', cell: (info: CellContext<any, any>) => <span style={{ color: 'var(--mt-text-secondary)' }}>{info.getValue() as string}</span> },
    { accessorKey: 'category', header: 'Clasificación', cell: (info: CellContext<any, any>) => <span className="bg-[var(--mt-surface-subtle)] px-2 py-0.5 rounded text-[11px]">{info.getValue() as string}</span> },
    { accessorKey: 'total', header: 'Total', cell: (info: CellContext<any, any>) => <span style={{ fontWeight: 500 }}>{formatCurrency(info.getValue() as number)}</span> },
    { accessorKey: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
        const status = info.getValue() as string;
        const isPaid = status === 'pagado';
        const isPpd = status === 'ppd';
        return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, backgroundColor: isPaid ? '#142818' : isPpd ? 'var(--mt-warning-bg)' : '#2F1517', border: `1px solid ${isPaid ? '#1E4624' : isPpd ? 'var(--mt-warning-border)' : '#542226'}`, color: isPaid ? '#7CE38B' : isPpd ? 'var(--mt-warning-text)' : '#F87171' }}>{status.toUpperCase()}</span>;
    }},
    { id: 'actions', header: 'Acciones', cell: () => (
      <Button variant="ghost" size="sm" onClick={() => setIsCalcOpen(true)} className="flex items-center gap-1.5">
        <Calculator size={14} /> Calcular precio
      </Button>
    )}
  ], []);

  const supplierColumns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'name', header: 'Proveedor', cell: (info: CellContext<any, any>) => <span style={{ fontWeight: 500 }}>{info.getValue() as string}</span> },
    { accessorKey: 'rfc', header: 'RFC', cell: (info: CellContext<any, any>) => <span style={{ color: 'var(--mt-text-secondary)' }}>{info.getValue() as string}</span> },
    { accessorKey: 'total', header: 'Total Comprado', cell: (info: CellContext<any, any>) => <span style={{ fontWeight: 500 }}>{info.getValue() as string}</span> },
    { accessorKey: 'lastDate', header: 'Última Compra' },
    { id: 'actions', header: 'Acciones', cell: () => (
      <Button variant="secondary" size="sm" onClick={() => setIsSupplierOpen(true)} className="flex items-center gap-1.5">
        <UserRound size={14} /> Ver Ficha
      </Button>
    )}
  ], []);

  const dummySuppliers = [{ name: 'PROVEEDOR EJEMPLO S.A. DE C.V.', rfc: 'EXA123456789', total: '$10,000.00', lastDate: '08/07/2026' }];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="mt-page-title" style={{ fontSize: '28px', letterSpacing: '-0.8px', marginBottom: '4px' }}>Administración</h1>
            <p className="mt-page-subtitle" style={{ fontSize: '14px', color: 'var(--mt-text-secondary)' }}>Gestiona los ingresos, gastos y directorio de proveedores.</p>
          </div>
          {(activeTab === 'ingresos' || activeTab === 'gastos') && (
            <div>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept={activeTab === 'ingresos' ? '.txt,.csv' : '.xml'} onChange={handleFileUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-btn-secondary"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  backgroundColor: 'var(--mt-surface-subtle)', border: '1px solid var(--mt-border)', 
                  padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', 
                  color: 'var(--mt-text-primary)', transition: 'all 0.2s', fontWeight: 500
                }}
              >
                <Upload size={16} />
                <span style={{ fontSize: '14px' }}>Importar archivo {activeTab === 'ingresos' ? 'TXT' : 'XML'}</span>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--mt-surface-subtle)', borderRadius: '8px', border: '1px solid var(--mt-border)' }}>
              <FileText size={24} style={{ color: '#60a5fa' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mt-text-primary)' }}>{previewData.filename}</div>
                <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>Tipo: {previewData.fileType}</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--mt-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--mt-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', marginBottom: '4px' }}>Período / Fecha</div>
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
                    style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--mt-text-primary)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                  />
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--mt-text-primary)' }}>{previewData.period}</div>
                )}
              </div>
              <div style={{ backgroundColor: 'var(--mt-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--mt-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', marginBottom: '4px' }}>Registros</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--mt-text-primary)' }}>{previewData.records} detectados</div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--mt-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--mt-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', marginBottom: '4px' }}>Total reconocido</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: previewData.type === 'ingresos' ? '#34d399' : '#fb7185' }}>
                {previewData.total ? formatCurrency(previewData.total) : formatCurrency(previewData.amount)}
              </div>
            </div>

            {previewData.warnings && previewData.warnings.length > 0 && (
              <div style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                  <AlertTriangle size={16} />
                  Advertencias
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                  {previewData.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <Button variant="ghost" size="md" onClick={cancelImport} style={{ flex: 1 }}>Cancelar</Button>
              <Button variant="primary" size="md" onClick={confirmImport} style={{ flex: 1, gap: '8px' }}>
                <CheckCircle size={16} /> Confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
