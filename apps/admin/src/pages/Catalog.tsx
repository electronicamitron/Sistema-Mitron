import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../components/ui/DataTable';
import { PackageX, Tag, CheckSquare, Settings2, FolderTree, Bookmark, CheckCircle, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button, Modal, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Input } from '@mitron/ui';
import type { ColumnDef, CellContext } from '@tanstack/react-table';
import type { Product } from '../types/product';
import { CATEGORIES, getSubcategoriesForCategory, getCategoryName, getSubcategoryName } from '../lib/catalog/categories';
import { getBrandName, type Brand } from '../lib/catalog/brands';

export default function Catalog() {
  const { products, updateProduct, bulkUpdateProducts, brands, addBrand, deleteBrand, addNotification } = useData();
  const navigate = useNavigate();

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  
  // Bulk Edit State
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('');
  const [bulkSubcategoryId, setBulkSubcategoryId] = useState<string>('');
  const [bulkBrandId, setBulkBrandId] = useState<string>('');

  // Single Edit State
  const [singleEditOpen, setSingleEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [singleCategoryId, setSingleCategoryId] = useState<string>('');
  const [singleSubcategoryId, setSingleSubcategoryId] = useState<string>('');
  const [singleBrandId, setSingleBrandId] = useState<string>('');

  // Brand Management
  const [brandsModalOpen, setBrandsModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [editingBrandId, setEditingBrandId] = useState('');
  const [editBrandName, setEditBrandName] = useState('');

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (filterCategory !== 'all' && p.categoryId !== filterCategory) return false;
      if (filterSubcategory !== 'all' && p.subcategoryId !== filterSubcategory) return false;
      if (filterBrand !== 'all' && p.brandId !== filterBrand) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.description.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, filterCategory, filterSubcategory, filterBrand, searchQuery]);

  const formatCurrency = (val: number | null | undefined, fallback: string = 'Sin costo de compra') => {
    if (val == null) return fallback;
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const handleOpenPricing = useCallback((p: Product) => {
    navigate('/administration', { state: { tab: 'precios', selectedProductId: p.id } });
  }, [navigate]);

  const openSingleEdit = (p: Product) => {
    setEditingProduct(p);
    setSingleCategoryId(p.categoryId || '');
    setSingleSubcategoryId(p.subcategoryId || '');
    setSingleBrandId(p.brandId || '');
    setSingleEditOpen(true);
  };

  const saveSingleEdit = () => {
    if (!editingProduct) return;
    updateProduct(editingProduct.id, {
      categoryId: singleCategoryId || null,
      subcategoryId: singleSubcategoryId || null,
      brandId: singleBrandId || null,
    });
    addNotification({ title: 'Producto actualizado', description: `Se actualizó la clasificación de ${editingProduct.sku}`, type: 'success' });
    setSingleEditOpen(false);
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  const openBulkEdit = () => {
    if (selectedProductIds.length === 0) return;
    setBulkCategoryId('');
    setBulkSubcategoryId('');
    setBulkBrandId('');
    setIsBulkEditOpen(true);
  };

  const requestBulkConfirm = () => {
    setIsBulkEditOpen(false);
    setBulkConfirmOpen(true);
  };

  const executeBulkEdit = () => {
    const updates: Partial<Product> = {};
    if (bulkCategoryId) updates.categoryId = bulkCategoryId === 'none' ? null : bulkCategoryId;
    if (bulkSubcategoryId) updates.subcategoryId = bulkSubcategoryId === 'none' ? null : bulkSubcategoryId;
    if (bulkBrandId) updates.brandId = bulkBrandId === 'none' ? null : bulkBrandId;

    if (Object.keys(updates).length > 0) {
      bulkUpdateProducts(selectedProductIds, updates);
      addNotification({ title: 'Clasificación masiva', description: `Se actualizaron ${selectedProductIds.length} productos.`, type: 'success' });
    }
    setBulkConfirmOpen(false);
    setSelectedProductIds([]);
  };

  const cancelBulkConfirm = () => {
    setBulkConfirmOpen(false);
    setIsBulkEditOpen(true);
  };

  const createBrand = () => {
    if (!newBrandName.trim()) return;
    if (brands.some(b => b.name.toLowerCase() === newBrandName.trim().toLowerCase())) {
      addNotification({ title: 'Marca duplicada', description: 'Esta marca ya existe', type: 'warning' });
      return;
    }
    const newBrand: Brand = {
      id: `brand_${Date.now()}`,
      name: newBrandName.trim()
    };
    addBrand(newBrand);
    setNewBrandName('');
    addNotification({ title: 'Marca creada', description: `Se agregó ${newBrand.name}`, type: 'success' });
  };

  const saveEditBrand = () => {
    if (!editBrandName.trim() || !editingBrandId) return;
    if (brands.some(b => b.id !== editingBrandId && b.name.toLowerCase() === editBrandName.trim().toLowerCase())) {
      addNotification({ title: 'Marca duplicada', description: 'Esta marca ya existe', type: 'warning' });
      return;
    }
    const b = brands.find(br => br.id === editingBrandId);
    if(b) {
      deleteBrand(editingBrandId);
      addBrand({ ...b, name: editBrandName.trim() });
    }
    setEditingBrandId('');
    setEditBrandName('');
  };

  const removeBrand = (id: string) => {
    const isAssigned = products.some(p => p.brandId === id);
    if (isAssigned) {
      if (!confirm('Esta marca está asignada a algunos productos. ¿Eliminar y dejar esos productos sin marca?')) {
        return;
      }
      const pIds = products.filter(p => p.brandId === id).map(p => p.id);
      bulkUpdateProducts(pIds, { brandId: null });
    } else {
      if (!confirm('¿Eliminar esta marca?')) return;
    }
    deleteBrand(id);
  };

  const catalogColumns: ColumnDef<any, any>[] = useMemo(() => [
    { 
      id: 'selection',
      header: () => (
        <div className="flex items-center justify-center cursor-pointer" onClick={toggleSelectAll}>
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedProductIds.length > 0 && selectedProductIds.length === products.length ? 'bg-mt-text-primary border-mt-text-primary' : selectedProductIds.length > 0 ? 'bg-mt-text-primary/50 border-mt-text-primary' : 'border-mt-border'}`}>
            {selectedProductIds.length > 0 && <CheckSquare size={12} className="text-mt-bg" />}
          </div>
        </div>
      ),
      cell: (info: CellContext<any, any>) => {
        const id = info.row.original.id;
        const isSelected = selectedProductIds.includes(id);
        return (
          <div className="flex items-center justify-center cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleProductSelection(id); }}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-mt-text-primary border-mt-text-primary' : 'border-mt-border group-hover:border-mt-text-secondary'}`}>
              {isSelected && <CheckSquare size={12} className="text-mt-bg" />}
            </div>
          </div>
        );
      }
    },
    { accessorKey: 'sku', header: 'SKU', cell: (info: CellContext<any, any>) => <span className="font-semibold text-mt-text-primary text-[13px]">{info.getValue() as string}</span> },
    { 
      accessorKey: 'description', 
      header: 'Producto', 
      cell: (info: CellContext<any, any>) => {
        const p = info.row.original as Product;
        return (
          <div className="py-1">
            <div className="font-medium text-mt-text-primary text-sm line-clamp-1">{p.description}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-mt-text-secondary flex items-center gap-1">
                <FolderTree size={10} /> {getCategoryName(p.categoryId)} {p.subcategoryId ? `> ${getSubcategoryName(p.subcategoryId)}` : ''}
              </span>
              {p.brandId && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-mt-surface-subtle border border-mt-border text-mt-text-secondary flex items-center gap-1">
                  <Bookmark size={10} /> {getBrandName(p.brandId, brands)}
                </span>
              )}
            </div>
          </div>
        )
      }
    },
    { accessorKey: 'purchaseCost', header: 'Costo', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary text-sm">{info.getValue() !== null ? formatCurrency(info.getValue() as number) : 'Sin costo de compra'}</span> },
    { accessorKey: 'salePrice', header: 'Precio (público)', cell: (info: CellContext<any, any>) => {
        const val = info.getValue();
        return <span className={`text-sm font-semibold ${val !== null ? 'text-emerald-400' : 'text-mt-text-muted'}`}>{val !== null ? formatCurrency(val as number) : 'Sin precio de venta'}</span>;
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => {
        const p = info.row.original as Product;
        const hasCost = p.purchaseCost !== null && p.purchaseCost > 0;
        
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => openSingleEdit(p)} title="Clasificar producto" className="px-2">
              <Tag size={14} /> <span className="ml-1 text-xs">Clasificar producto</span>
            </Button>
            {hasCost && (
              <Button variant="ghost" size="sm" onClick={() => handleOpenPricing(p)} title="Calcular Precio" className="text-blue-400 hover:text-blue-300 px-2">
                $ <span className="ml-1 text-xs">Precio</span>
              </Button>
            )}
          </div>
        );
    }}
  ], [selectedProductIds, products, brands, handleOpenPricing, openSingleEdit, toggleProductSelection]);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="mt-page-header mb-0 items-start justify-between">
        <div>
          <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Catálogo</h1>
          <p className="mt-page-subtitle text-sm text-mt-text-secondary">Clasificación, precios y directorio de productos.</p>
        </div>
        <div className="flex gap-3">
          {selectedProductIds.length > 0 && (
            <button onClick={openBulkEdit} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 rounded-lg cursor-pointer text-blue-400 transition-all font-medium hover:bg-blue-500/20">
              <Settings2 size={16} /> <span className="text-sm">Editar {selectedProductIds.length} producto{selectedProductIds.length === 1 ? '' : 's'}</span>
            </button>
          )}
          <button onClick={() => setBrandsModalOpen(true)} className="flex items-center gap-2 bg-mt-surface-subtle border border-mt-border px-4 py-2.5 rounded-lg cursor-pointer text-mt-text-primary transition-all font-medium hover:bg-mt-surface-hover">
            <Bookmark size={16} /> <span className="text-sm">Marcas</span>
          </button>
        </div>
      </div>

      <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5">
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <div className="w-[180px]">
            <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setFilterSubcategory('all'); }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[180px]">
            <Select value={filterSubcategory} onValueChange={setFilterSubcategory} disabled={filterCategory === 'all'}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Subcategoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las subcategorías</SelectItem>
                {filterCategory !== 'all' && getSubcategoriesForCategory(filterCategory).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[180px]">
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Marca" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar por SKU o descripción..." className="h-8 text-xs w-full" />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
           <div className="py-16 flex flex-col items-center justify-center text-mt-text-muted">
             <PackageX size={48} className="mb-4 opacity-50" />
             <p className="text-sm font-medium">No se encontraron productos.</p>
           </div>
        ) : (
          <DataTable 
            columns={catalogColumns} 
            data={filteredProducts} 
          />
        )}
      </div>

      {/* Bulk Edit Modal */}
      <Modal isOpen={isBulkEditOpen} onClose={() => setIsBulkEditOpen(false)} title={`Edición Masiva (${selectedProductIds.length} productos)`} width="450px">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-mt-text-secondary mb-2">Deja los campos en blanco para no modificar su valor actual. Selecciona "Ninguno" para borrar el valor actual.</p>
          
          <div>
            <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Categoría</label>
            <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
              <SelectTrigger><SelectValue placeholder="Sin cambios" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-rose-400 font-medium">Ninguna (Borrar)</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Subcategoría</label>
            <Select value={bulkSubcategoryId} onValueChange={setBulkSubcategoryId} disabled={!bulkCategoryId || bulkCategoryId === 'none'}>
              <SelectTrigger><SelectValue placeholder="Sin cambios" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-rose-400 font-medium">Ninguna (Borrar)</SelectItem>
                {bulkCategoryId && bulkCategoryId !== 'none' && getSubcategoriesForCategory(bulkCategoryId).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Marca</label>
            <Select value={bulkBrandId} onValueChange={setBulkBrandId}>
              <SelectTrigger><SelectValue placeholder="Sin cambios" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-rose-400 font-medium">Ninguna (Borrar)</SelectItem>
                {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="ghost" size="md" onClick={() => setIsBulkEditOpen(false)} className="flex-1">Cancelar</Button>
            <Button variant="primary" size="md" onClick={requestBulkConfirm} className="flex-1 gap-2"><CheckCircle size={16} /> Aplicar cambios</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Confirm Modal */}
      <Modal isOpen={bulkConfirmOpen} onClose={cancelBulkConfirm} title="Confirmar cambios" width="400px">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-mt-text-primary font-medium">Aplicar cambios a {selectedProductIds.length} producto{selectedProductIds.length === 1 ? '' : 's'}</p>
          <div className="bg-mt-surface-subtle rounded-lg p-3 border border-mt-border space-y-1.5">
            {bulkCategoryId && <div className="flex justify-between text-[13px]"><span className="text-mt-text-secondary">Categoría:</span><span className="text-mt-text-primary font-medium">{bulkCategoryId === 'none' ? 'Ninguna' : getCategoryName(bulkCategoryId)}</span></div>}
            {bulkSubcategoryId && <div className="flex justify-between text-[13px]"><span className="text-mt-text-secondary">Subcategoría:</span><span className="text-mt-text-primary font-medium">{bulkSubcategoryId === 'none' ? 'Ninguna' : getSubcategoryName(bulkSubcategoryId)}</span></div>}
            {bulkBrandId && <div className="flex justify-between text-[13px]"><span className="text-mt-text-secondary">Marca:</span><span className="text-mt-text-primary font-medium">{bulkBrandId === 'none' ? 'Ninguna' : getBrandName(bulkBrandId, brands)}</span></div>}
            {!bulkCategoryId && !bulkSubcategoryId && !bulkBrandId && <p className="text-xs text-mt-text-muted italic">No se seleccionaron cambios.</p>}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="md" onClick={cancelBulkConfirm} className="flex-1">Cancelar</Button>
            <Button variant="primary" size="md" onClick={executeBulkEdit} className="flex-1" disabled={!bulkCategoryId && !bulkSubcategoryId && !bulkBrandId}>Aplicar cambios</Button>
          </div>
        </div>
      </Modal>

      {/* Single Edit Modal */}
      <Modal isOpen={singleEditOpen} onClose={() => setSingleEditOpen(false)} title="Clasificar Producto" width="450px">
        {editingProduct && (
          <div className="flex flex-col gap-4">
            <div className="bg-mt-surface-subtle p-3 rounded-lg border border-mt-border mb-2">
              <div className="text-sm font-semibold text-mt-text-primary">{editingProduct.description}</div>
              <div className="text-xs text-mt-text-secondary mt-1">SKU: {editingProduct.sku}</div>
            </div>

            <div>
              <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Categoría</label>
              <Select value={singleCategoryId} onValueChange={v => { setSingleCategoryId(v); setSingleSubcategoryId(''); }}>
                <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin categoría</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Subcategoría</label>
              <Select value={singleSubcategoryId} onValueChange={setSingleSubcategoryId} disabled={!singleCategoryId}>
                <SelectTrigger><SelectValue placeholder="Sin subcategoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin subcategoría</SelectItem>
                  {singleCategoryId && getSubcategoriesForCategory(singleCategoryId).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[13px] text-mt-text-primary mb-1.5 font-medium">Marca</label>
              <Select value={singleBrandId} onValueChange={setSingleBrandId}>
                <SelectTrigger><SelectValue placeholder="Sin marca" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin marca</SelectItem>
                  {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 mt-4">
              <Button variant="ghost" size="md" onClick={() => setSingleEditOpen(false)} className="flex-1">Cancelar</Button>
              <Button variant="primary" size="md" onClick={saveSingleEdit} className="flex-1 gap-2"><CheckCircle size={16} /> Guardar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Brands Modal */}
      <Modal isOpen={brandsModalOpen} onClose={() => setBrandsModalOpen(false)} title="Gestión de Marcas" width="400px">
        <div className="flex flex-col gap-5">
          <div className="flex gap-2">
            <Input type="text" value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="Nueva marca..." className="flex-1" />
            <Button variant="primary" onClick={createBrand} disabled={!newBrandName.trim()}>Añadir</Button>
          </div>
          
          <div className="border border-mt-border rounded-lg bg-mt-surface-subtle max-h-[300px] overflow-y-auto">
            {brands.length === 0 ? (
              <div className="p-4 text-center text-sm text-mt-text-muted">No hay marcas registradas.</div>
            ) : (
              brands.map(b => (
                <div key={b.id} className="flex justify-between items-center p-3 border-b border-mt-border last:border-0 hover:bg-mt-surface transition-colors">
                  {editingBrandId === b.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <Input type="text" value={editBrandName} onChange={e => setEditBrandName(e.target.value)} className="h-7 text-xs flex-1" autoFocus onKeyDown={e => e.key === 'Enter' && saveEditBrand()} />
                      <Button variant="primary" size="sm" onClick={saveEditBrand} className="h-7 px-2">Ok</Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingBrandId('')} className="h-7 px-2">X</Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-mt-text-primary flex-1">{b.name}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingBrandId(b.id); setEditBrandName(b.name); }} className="text-mt-text-secondary hover:text-blue-400 h-7 w-7 p-0">
                          <Settings2 size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeBrand(b.id)} className="text-rose-400 hover:text-rose-300 h-7 w-7 p-0">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-end mt-2">
            <Button variant="ghost" onClick={() => setBrandsModalOpen(false)}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
