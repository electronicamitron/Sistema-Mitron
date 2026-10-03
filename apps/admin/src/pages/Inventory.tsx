import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DataTable } from '../components/ui/DataTable';
import { Button, Modal, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@mitron/ui';
import { InventoryMovements } from '../components/domain/InventoryMovements';
import { PackageCheck, PackageMinus, PackageX, Eye, AlertCircle, Plus, Pencil, Trash2, CheckCircle, Truck } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getRawStock, getInventoryStatus, hasIncompleteHistory } from '../lib/inventory/selectors';
import { formatDateHuman } from '../lib/utils';
import type { ColumnDef, CellContext } from '@tanstack/react-table';
import type { Product } from '../types/product';
import type { SupplyRecord, SupplyStatus } from '../types/supply';

import { CATEGORIES, getSubcategoriesForCategory, getCategoryName, getSubcategoryName } from '../lib/catalog/categories';
import { getBrandName } from '../lib/catalog/brands';

export default function Inventory() {
  const { products, inventoryMovements, suppliers, brands,
    supplyRecords, addSupplyRecord, updateSupplyRecord, deleteSupplyRecord,
    addNotification } = useData();
  
  const location = useLocation();
  const navigate = useNavigate();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [activeTab, setActiveTab] = useState<'existencias' | 'movimientos' | 'abastecimiento'>('existencias');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Supply modal
  const [supplyModalOpen, setSupplyModalOpen] = useState(false);
  const [editingSupplyId, setEditingSupplyId] = useState<string | null>(null);
  const [supplyProductId, setSupplyProductId] = useState('');
  const [supplySupplierId, setSupplySupplierId] = useState('');
  const [supplyQtyReq, setSupplyQtyReq] = useState(0);
  const [supplyQtyOrd, setSupplyQtyOrd] = useState(0);
  const [supplyQtyRec, setSupplyQtyRec] = useState(0);
  const [supplyStatus, setSupplyStatusLocal] = useState<SupplyStatus>('POR COMPRAR');
  const [supplyExpDate, setSupplyExpDate] = useState('');
  const [supplyNotes, setSupplyNotesLocal] = useState('');



  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab as any);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const formatCurrency = (val: number | null | undefined, fallback: string = '—') => {
    if (val == null) return fallback;
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  useEffect(() => {
    if (supplyStatus !== 'CANCELADO') {
      let derived: SupplyStatus = 'POR COMPRAR';
      if (supplyQtyRec >= supplyQtyReq && supplyQtyReq > 0 && supplyQtyReq === supplyQtyOrd) {
        derived = 'RECIBIDO';
      } else if (supplyQtyRec >= supplyQtyOrd && supplyQtyOrd > 0) {
        derived = 'RECIBIDO';
      } else if (supplyQtyOrd > 0) {
        derived = 'PEDIDO'; // PARCIAL is display-only now
      }
      if (derived !== supplyStatus) setSupplyStatusLocal(derived);
    }
  }, [supplyQtyReq, supplyQtyOrd, supplyQtyRec, supplyStatus]);

  const handleDetailClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  // Supply CRUD
  const openNewSupply = () => {
    setEditingSupplyId(null);
    setSupplyProductId('');
    setSupplySupplierId('');
    setSupplyQtyReq(0);
    setSupplyQtyOrd(0);
    setSupplyQtyRec(0);
    setSupplyStatusLocal('POR COMPRAR');
    setSupplyExpDate('');
    setSupplyNotesLocal('');
    setSupplyModalOpen(true);
  };

  const openEditSupply = (record: SupplyRecord) => {
    setEditingSupplyId(record.id);
    setSupplyProductId(record.productId);
    setSupplySupplierId(record.supplierId || '');
    setSupplyQtyReq(record.quantityRequested);
    setSupplyQtyOrd(record.quantityOrdered);
    setSupplyQtyRec(record.quantityReceived);
    setSupplyStatusLocal(record.status);
    setSupplyExpDate(record.expectedDate ? record.expectedDate.split('T')[0] : '');
    setSupplyNotesLocal(record.notes || '');
    setSupplyModalOpen(true);
  };

  const saveSupply = () => {
    const data: SupplyRecord = {
      id: editingSupplyId || Date.now().toString(),
      productId: supplyProductId,
      supplierId: supplySupplierId || undefined,
      quantityRequested: supplyQtyReq,
      quantityOrdered: supplyQtyOrd,
      quantityReceived: supplyQtyRec,
      status: supplyStatus,
      createdAt: editingSupplyId ? (supplyRecords.find(r => r.id === editingSupplyId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      expectedDate: supplyExpDate || undefined,
      notes: supplyNotes || undefined,
    };
    if (editingSupplyId) {
      updateSupplyRecord(editingSupplyId, data);
      addNotification({ title: 'Abastecimiento actualizado', description: 'Se guardaron los cambios.', type: 'success' });
    } else {
      addSupplyRecord(data);
      addNotification({ title: 'Registro creado', description: 'Se creó el registro de abastecimiento.', type: 'success' });
    }
    setSupplyModalOpen(false);
  };

  // Removed request CRUD since it moved to CRM

  // Removed saveRequest

  const inventoryColumns: ColumnDef<any, any>[] = useMemo(() => [
    { 
      accessorKey: 'description', 
      header: 'Producto', 
      cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        const catStr = [getCategoryName(p.categoryId), getSubcategoryName(p.subcategoryId)].filter(x => x !== 'Sin categoría' && x !== 'Sin subcategoría').join(' / ');
        const brandStr = getBrandName(p.brandId, brands);
        return (
          <div className="py-1">
            <div className="font-semibold text-mt-text-primary">{p.description}</div>
            <div className="text-[11px] text-mt-text-secondary mt-0.5">
              <span className="font-mono">{p.sku}</span>
              {catStr && <span className="mx-1.5">•</span>}
              {catStr && <span>{catStr}</span>}
              {brandStr !== 'Sin marca' && <span className="mx-1.5">•</span>}
              {brandStr !== 'Sin marca' && <span>{brandStr}</span>}
            </div>
          </div>
        )
      } 
    },
    { accessorKey: 'unit', header: 'Unidad', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary">{info.getValue() as string}</span> },
    { id: 'existencia', header: 'Existencia', cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        const rawStock = getRawStock(p.id, inventoryMovements);
        const hasAlert = hasIncompleteHistory(rawStock, p.hasPurchaseHistory);
        if (hasAlert) {
          return (<div className="flex flex-col"><span className="font-semibold text-[15px] text-mt-text-secondary">—</span><span className="text-[10px] text-mt-text-muted font-medium">Sin dato</span></div>);
        }
        const displayed = Math.max(0, rawStock);
        return (<div className="flex flex-col"><span className={`font-semibold text-[15px] ${rawStock <= 0 ? 'text-rose-400' : 'text-inherit'}`}>{displayed}</span></div>);
    }},
    { id: 'costo', header: 'Costo', cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        return <span className={`text-[13px] ${p.purchaseCost == null ? 'text-mt-text-muted italic' : 'text-mt-text-secondary'}`}>{formatCurrency(p.purchaseCost, 'Sin costo de compra')}</span>;
    }},
    { id: 'precio', header: 'Precio de venta', cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        return <span className={`text-[13px] font-medium ${p.salePrice == null ? 'text-mt-text-muted italic font-normal' : 'text-mt-text-primary'}`}>{formatCurrency(p.salePrice, 'Sin precio de venta')}</span>;
    }},
    { id: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        const rawStock = getRawStock(p.id, inventoryMovements);
        const status = getInventoryStatus(rawStock, p.hasPurchaseHistory);
        const hasAlert = hasIncompleteHistory(rawStock, p.hasPurchaseHistory);
        return (
          <div 
            title={hasAlert ? 'Sin historial de compra' : ''}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border border-transparent ${
             hasAlert ? 'bg-blue-500/10 text-blue-400' :
             status === 'DISPONIBLE' ? 'bg-emerald-500/10 text-emerald-400' :
             status === 'STOCK BAJO' ? 'bg-amber-500/10 text-amber-400' :
             'bg-rose-500/10 text-rose-400'
          }`}>
            {hasAlert && <AlertCircle size={14} />}
            {!hasAlert && status === 'DISPONIBLE' && <PackageCheck size={14} />}
            {!hasAlert && status === 'STOCK BAJO' && <PackageMinus size={14} />}
            {!hasAlert && status === 'SIN EXISTENCIAS' && <PackageX size={14} />}
            {hasAlert ? 'SIN HISTORIAL' : status}
          </div>
        );
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => (
      <Button variant="ghost" size="sm" onClick={() => handleDetailClick(info.row.original)} className="flex items-center gap-1.5 px-2">
        <Eye size={14} /> Detalle
      </Button>
    )}
  ], [inventoryMovements]);

  // Supply columns
  const supplyColumns: ColumnDef<any, any>[] = useMemo(() => [
    { id: 'product', header: 'Producto', cell: (info: CellContext<any, any>) => {
      const r = info.row.original as SupplyRecord;
      const prod = products.find(p => p.id === r.productId);
      return <div><div className="font-medium text-sm text-mt-text-primary">{prod?.description || r.productId}</div><div className="text-[11px] text-mt-text-secondary">{prod?.sku || ''}</div></div>;
    }},
    { id: 'supplier', header: 'Proveedor', cell: (info: CellContext<any, any>) => {
      const r = info.row.original as SupplyRecord;
      const sup = suppliers.find(s => s.id === r.supplierId);
      return <span className="text-mt-text-secondary text-sm">{sup?.name || '—'}</span>;
    }},
    { accessorKey: 'quantityRequested', header: 'Solicitado', cell: (info: CellContext<any, any>) => <span className="text-sm">{info.getValue() as number}</span> },
    { accessorKey: 'quantityOrdered', header: 'Pedido', cell: (info: CellContext<any, any>) => <span className="text-sm">{info.getValue() as number}</span> },
    { accessorKey: 'quantityReceived', header: 'Recibido', cell: (info: CellContext<any, any>) => <span className="text-sm font-medium text-emerald-400">{info.getValue() as number}</span> },
    { id: 'expectedDate', header: 'Fecha esperada', cell: (info: CellContext<any, any>) => {
      const r = info.row.original as SupplyRecord;
      return <span className="text-mt-text-secondary text-sm">{r.expectedDate ? formatDateHuman(r.expectedDate) : '—'}</span>;
    }},
    { id: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
      const r = info.row.original as SupplyRecord;
      let derivedStatus = r.status;
      if (r.status !== 'CANCELADO') {
        if (r.quantityReceived >= r.quantityRequested && r.quantityRequested > 0 && r.quantityRequested === r.quantityOrdered) {
          derivedStatus = 'RECIBIDO';
        } else if (r.quantityReceived >= r.quantityOrdered && r.quantityOrdered > 0) {
          derivedStatus = 'RECIBIDO';
        } else if (r.quantityReceived > 0 && r.quantityOrdered > 0 && r.quantityReceived < r.quantityOrdered) {
          derivedStatus = 'PARCIAL'; // Will display as Recepción parcial
        } else if (r.quantityOrdered > 0 && r.quantityReceived === 0) {
          derivedStatus = 'PEDIDO';
        } else {
          derivedStatus = 'POR COMPRAR';
        }
      }

      const colors: Record<string, string> = {
        'POR COMPRAR': 'bg-mt-surface-subtle text-mt-text-muted',
        'PEDIDO': 'bg-blue-500/10 text-blue-400',
        'PARCIAL': 'bg-purple-500/10 text-purple-400',
        'RECIBIDO': 'bg-emerald-500/10 text-emerald-400',
        'CANCELADO': 'bg-rose-500/10 text-rose-400',
      };
      const displayStatus = derivedStatus === 'PARCIAL' ? 'Recepción parcial' : derivedStatus;
      return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[derivedStatus] || colors['POR COMPRAR']}`}>{displayStatus}</span>;
    }},
    { id: 'actions', header: '', cell: (info: CellContext<any, any>) => {
      const r = info.row.original as SupplyRecord;
      return (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditSupply(r)}><Pencil size={14} /></Button>
          <Button variant="ghost" size="sm" onClick={() => { if (confirm('¿Eliminar este registro?')) { deleteSupplyRecord(r.id); addNotification({ title: 'Eliminado', description: 'Se eliminó el registro.', type: 'info' }); } }} className="text-rose-400"><Trash2 size={14} /></Button>
        </div>
      );
    }}
  ], [products, suppliers, deleteSupplyRecord, addNotification, openEditSupply]);

  // Removed requestColumns

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="mt-page-header mb-0">
        <div>
          <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Inventario</h1>
          <p className="mt-page-subtitle text-sm text-mt-text-secondary">Existencias, movimientos y abastecimiento.</p>
        </div>
        {activeTab === 'abastecimiento' && (
          <button onClick={openNewSupply} className="flex items-center gap-2 bg-white border-none px-4 py-2.5 rounded-lg cursor-pointer text-black transition-all font-semibold hover:-translate-y-[1px]">
            <Plus size={16} /> <span className="text-sm">Nuevo registro</span>
          </button>
        )}
      </div>

      <div className="flex gap-6 mt-6 border-b border-mt-border">
        {([
          { id: 'existencias' as const, label: 'Existencias' },
          { id: 'movimientos' as const, label: 'Movimientos' },
          { id: 'abastecimiento' as const, label: 'Abastecimiento' },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`bg-transparent border-none text-sm cursor-pointer pb-3 transition-all -mb-[1px] ${activeTab === tab.id ? 'text-mt-text-primary font-semibold border-b-2 border-mt-text-primary' : 'text-mt-text-secondary font-medium border-b-2 border-transparent'}`}
          >{tab.label}</button>
        ))}
      </div>

      {activeTab === 'existencias' && (
        <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5 animate-fade-in">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'DISPONIBLE', label: 'Disponibles' },
                { id: 'STOCK BAJO', label: 'Stock bajo' },
                { id: 'SIN EXISTENCIAS', label: 'Sin existencias' },
                { id: 'SIN HISTORIAL', label: 'Sin historial' }
              ].map(f => (
                <button 
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${filterStatus === f.id ? 'bg-mt-text-primary text-mt-bg' : 'bg-mt-surface-subtle text-mt-text-secondary hover:bg-mt-surface-hover border border-mt-border'}`}
                >{f.label}</button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="w-[160px]">
                <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setFilterSubcategory('all'); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Categoría" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[160px]">
                <Select value={filterSubcategory} onValueChange={setFilterSubcategory} disabled={filterCategory === 'all'}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Subcategoría" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las subcategorías</SelectItem>
                    {filterCategory !== 'all' && getSubcategoriesForCategory(filterCategory).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[160px]">
                <Select value={filterBrand} onValueChange={setFilterBrand}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Marca" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las marcas</SelectItem>
                    {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar por SKU o producto..." className="h-8 text-xs w-full" />
              </div>
            </div>
          </div>

          <DataTable 
            columns={inventoryColumns} 
            data={products.filter(p => {
              if (filterCategory !== 'all' && p.categoryId !== filterCategory) return false;
              if (filterSubcategory !== 'all' && p.subcategoryId !== filterSubcategory) return false;
              if (filterBrand !== 'all' && p.brandId !== filterBrand) return false;
              if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!p.description.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
              }

              const rawStock = getRawStock(p.id, inventoryMovements);
              const status = getInventoryStatus(rawStock, p.hasPurchaseHistory);
              const hasAlert = hasIncompleteHistory(rawStock, p.hasPurchaseHistory);
              
              if (filterStatus === 'all') return true;
              if (filterStatus === 'SIN HISTORIAL') return hasAlert;
              if (hasAlert) return false;
              return status === filterStatus;
            })} 
          />
        </div>
      )}

      {activeTab === 'movimientos' && <InventoryMovements />}

      {activeTab === 'abastecimiento' && (
        <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5 animate-fade-in">
          {supplyRecords.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-mt-text-muted">
              <Truck size={48} className="mb-4 opacity-50" />
              <p className="text-sm font-medium">No hay registros de abastecimiento.</p>
              <p className="text-xs mt-1">Crea un nuevo registro para rastrear pedidos a proveedores.</p>
            </div>
          ) : (
            <DataTable columns={supplyColumns} data={supplyRecords} searchKey="productId" searchPlaceholder="Buscar..." />
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalle de Inventario" width="450px">
        {selectedProduct && (() => {
          const rawStock = getRawStock(selectedProduct.id, inventoryMovements);
          const hasAlert = hasIncompleteHistory(rawStock, selectedProduct.hasPurchaseHistory);
          const totalPurchased = inventoryMovements.filter(m => m.productId === selectedProduct.id && m.type === 'PURCHASE').reduce((s, m) => s + m.quantityDelta, 0);
          const totalSold = inventoryMovements.filter(m => m.productId === selectedProduct.id && m.type === 'SALE').reduce((s, m) => s + Math.abs(m.quantityDelta), 0);
          return (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-mt-surface-subtle border border-mt-border rounded-lg">
                <div className="text-sm font-semibold text-mt-text-primary">{selectedProduct.description}</div>
                <div className="text-xs text-mt-text-secondary mt-1">SKU: {selectedProduct.sku} | Unidad: {selectedProduct.unit}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-mt-surface border border-mt-border rounded-lg text-center">
                  <div className="text-[11px] text-mt-text-secondary mb-1">Comprado registrado</div>
                  <div className="text-lg font-bold text-emerald-400">{totalPurchased}</div>
                </div>
                <div className="p-3 bg-mt-surface border border-mt-border rounded-lg text-center">
                  <div className="text-[11px] text-mt-text-secondary mb-1">Vendido registrado</div>
                  <div className="text-lg font-bold text-rose-400">{totalSold}</div>
                </div>
              </div>
              <div className="p-4 bg-mt-surface border border-mt-border rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-mt-text-secondary mb-1">Existencia calculada</div>
                  {hasAlert ? (<div className="text-xl font-bold text-mt-text-secondary">Sin dato</div>) : (<div className="text-2xl font-bold text-mt-text-primary">{Math.max(0, rawStock)}</div>)}
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-mt-text-secondary mb-1">Estado</div>
                  <div className="text-sm font-semibold text-mt-text-primary">{getInventoryStatus(rawStock, selectedProduct.hasPurchaseHistory)}</div>
                </div>
              </div>
              {hasAlert && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 items-start">
                  <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-mt-text-secondary leading-relaxed">No hay compras suficientes registradas para calcular la existencia.</div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-mt-border flex justify-end">
                <Button variant="ghost" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Supply Modal */}
      <Modal isOpen={supplyModalOpen} onClose={() => setSupplyModalOpen(false)} title={editingSupplyId ? 'Editar abastecimiento' : 'Nuevo abastecimiento'} width="450px">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Producto</label>
            <Select value={supplyProductId} onValueChange={setSupplyProductId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
              <SelectContent>
                {products.filter(p => p.hasPurchaseHistory).map(p => <SelectItem key={p.id} value={p.id}>{p.description} ({p.sku})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Proveedor (opcional)</label>
            <Select value={supplySupplierId} onValueChange={setSupplySupplierId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
              <SelectContent>
                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-[11px] text-mt-text-secondary mb-1">Solicitado</label><Input type="number" value={supplyQtyReq} onChange={e => setSupplyQtyReq(Number(e.target.value))} min={0} /></div>
            <div><label className="block text-[11px] text-mt-text-secondary mb-1">Pedido</label><Input type="number" value={supplyQtyOrd} onChange={e => setSupplyQtyOrd(Number(e.target.value))} min={0} /></div>
            <div><label className="block text-[11px] text-mt-text-secondary mb-1">Recibido</label><Input type="number" value={supplyQtyRec} onChange={e => setSupplyQtyRec(Number(e.target.value))} min={0} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Estado</label>
              <Select value={supplyStatus} onValueChange={v => setSupplyStatusLocal(v as SupplyStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['POR COMPRAR', 'PEDIDO', 'RECIBIDO', 'CANCELADO'] as SupplyStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Fecha esperada</label><Input type="date" value={supplyExpDate} onChange={e => setSupplyExpDate(e.target.value)} /></div>
          </div>
          <div><label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Notas</label><Input type="text" value={supplyNotes} onChange={e => setSupplyNotesLocal(e.target.value)} placeholder="Notas..." /></div>
          <div className="flex gap-3 mt-2">
            <Button variant="ghost" size="md" onClick={() => setSupplyModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button variant="primary" size="md" onClick={saveSupply} className="flex-1 gap-2" disabled={!supplyProductId}><CheckCircle size={16} /> Guardar</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
