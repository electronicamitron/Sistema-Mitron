import { useState, useMemo, useCallback } from 'react';
import { DataTable } from '../components/ui/DataTable';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useData, type Product } from '../context/DataContext';
import { Modal, Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@mitron/ui';
import type { ColumnDef, CellContext } from '@tanstack/react-table';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const productSchema = z.object({
  sku: z.string().min(1, 'Requerido'),
  name: z.string().min(1, 'Requerido'),
  category: z.string().min(1, 'Requerido'),
  cost: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  supplier: z.string().min(1, 'Requerido'),
  status: z.enum(['vigente', 'descontinuado'])
});
type ProductFormValues = z.infer<typeof productSchema>;

export default function Catalog() {
  const { products, addProduct, updateProduct, setProducts } = useData();
  
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: { sku: '', name: '', category: '', cost: 0, price: 0, supplier: '', status: 'vigente' }
  });

  const handleOpenEdit = useCallback((p: Product) => {
    setEditingProduct(p);
    form.reset({
      sku: p.sku, name: p.name, category: p.category, cost: p.cost, price: p.price, supplier: p.supplier, status: p.status as 'vigente' | 'descontinuado'
    });
    setIsModalOpen(true);
  }, [form]);

  const catalogColumns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'sku', header: 'SKU', cell: (info: CellContext<any, any>) => <span className="font-semibold text-mt-text-primary">{info.getValue() as string}</span> },
    { accessorKey: 'name', header: 'Descripción', cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        return (
          <div className="flex items-center gap-2 font-medium">
            {p.name}
            {p.isMock && <span className="text-[9px] bg-mt-surface-subtle text-mt-text-secondary px-1.5 py-0.5 rounded font-semibold">DEMO</span>}
          </div>
        );
    }},
    { accessorKey: 'category', header: 'Categoría', cell: (info: CellContext<any, any>) => <span className="bg-mt-surface-subtle px-2 py-0.5 rounded text-[11px] text-mt-text-secondary">{info.getValue() as string}</span> },
    { accessorKey: 'cost', header: 'Costo', cell: (info: CellContext<any, any>) => formatCurrency(info.getValue() as number) },
    { accessorKey: 'price', header: 'Precio', cell: (info: CellContext<any, any>) => <span className={`font-semibold ${info.row.original.status === 'vigente' ? 'text-emerald-400' : 'text-mt-text-muted'}`}>{formatCurrency(info.getValue() as number)}</span> },
    { accessorKey: 'supplier', header: 'Proveedor', cell: (info: CellContext<any, any>) => <div className="text-mt-text-primary">{info.getValue() as string}</div> },
    { accessorKey: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
        const status = info.getValue() as string;
        const isActive = status === 'vigente';
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${isActive ? 'bg-[#142818] border-[#1E4624] text-[#7CE38B]' : 'bg-mt-surface-subtle border-mt-border text-mt-text-muted'}`}>
            {isActive ? 'Vigente' : 'Descontinuado'}
          </span>
        );
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => (
        <button 
          onClick={() => handleOpenEdit(info.row.original)}
          className="bg-transparent border-none text-mt-text-secondary cursor-pointer p-1 rounded hover:bg-mt-surface-subtle transition-colors"
        >
          <Edit2 size={16} />
        </button>
    )}
  ], [handleOpenEdit]);

  const filteredProducts = products.filter(p => {
    const matchCat = catFilter === 'all' || catFilter === '' || p.category === catFilter;
    const matchStatus = statusFilter === 'all' || statusFilter === '' || p.status === statusFilter;
    return matchCat && matchStatus;
  });

  const uniqueCategories = Array.from(new Set(products.map(p => p.category)));

  const handleOpenNew = () => {
    setEditingProduct(null);
    form.reset({ sku: '', name: '', category: '', cost: 0, price: 0, supplier: '', status: 'vigente' });
    setIsModalOpen(true);
  };

  const onSubmit = (data: ProductFormValues) => {
    if (editingProduct?.id) {
      updateProduct(editingProduct.id, { ...data, minStock: editingProduct.minStock, stock: editingProduct.stock });
    } else {
      addProduct({
        ...data,
        stock: null,
        minStock: 5,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (editingProduct?.id) {
      setProducts(prev => prev.filter(p => p.id !== editingProduct.id));
      setIsModalOpen(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="mt-page-header mb-0 items-center">
        <div>
          <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Catálogo</h1>
          <p className="mt-page-subtitle text-sm text-mt-text-secondary">Directorio de productos, costos y precios.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="flex items-center gap-2 bg-white border-none px-4 py-2.5 rounded-lg cursor-pointer text-black transition-all font-semibold hover:-translate-y-[1px]"
        >
          <Plus size={16} />
          <span className="text-sm">Nuevo Producto</span>
        </button>
      </div>

      <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5">
        <div className="flex flex-wrap gap-4 mb-6 justify-end">
          <div className="flex gap-3 flex-wrap">
            <div className="w-[200px]">
              <Select value={catFilter || 'all'} onValueChange={(val) => setCatFilter(val === 'all' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Select value={statusFilter || 'all'} onValueChange={(val) => setStatusFilter(val === 'all' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Estado (Todos)</SelectItem>
                  <SelectItem value="vigente">Vigente</SelectItem>
                  <SelectItem value="descontinuado">Descontinuado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DataTable 
          columns={catalogColumns} 
          data={filteredProducts} 
          searchKey="name" 
          searchPlaceholder="Buscar por descripción..." 
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct?.id ? "Editar Producto" : "Nuevo Producto"}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-2 font-medium">SKU</label>
              <Input type="text" placeholder="Ej. PROD-01" {...form.register('sku')} />
            </div>
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-2 font-medium">Nombre del producto</label>
              <Input type="text" placeholder="Ej. Monitor 24 pulgadas" {...form.register('name')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-2 font-medium">Costo</label>
              <Input type="number" {...form.register('cost')} />
            </div>
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-2 font-medium">Precio de venta</label>
              <Input type="number" {...form.register('price')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-2 font-medium">Categoría</label>
              <Input type="text" {...form.register('category')} />
            </div>
            <div>
              <label className="block text-[13px] text-mt-text-primary mb-2 font-medium">Estado</label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vigente">Vigente</SelectItem>
                      <SelectItem value="descontinuado">Descontinuado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] text-mt-text-primary mb-2 font-medium">Proveedor</label>
            <Input type="text" {...form.register('supplier')} />
          </div>

          <div className="flex justify-between items-center mt-4">
            {editingProduct?.id ? (
              <Button type="button" variant="danger" size="sm" onClick={handleDelete} className="gap-1.5">
                <Trash2 size={14} /> Eliminar
              </Button>
            ) : <div />}
            <div className="flex gap-3">
              <Button type="button" variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" size="md">Guardar</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
