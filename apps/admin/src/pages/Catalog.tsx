import { useState, useMemo } from 'react';
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

  const catalogColumns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'sku', header: 'SKU', cell: (info: CellContext<any, any>) => <span style={{ fontWeight: 600, color: 'var(--mt-text-primary)' }}>{info.getValue() as string}</span> },
    { accessorKey: 'name', header: 'Descripción', cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
            {p.name}
            {p.isMock && <span style={{ fontSize: '9px', backgroundColor: 'var(--mt-surface-subtle)', color: 'var(--mt-text-secondary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>DEMO</span>}
          </div>
        );
    }},
    { accessorKey: 'category', header: 'Categoría', cell: (info: CellContext<any, any>) => <span style={{ backgroundColor: 'var(--mt-surface-subtle)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--mt-text-secondary)' }}>{info.getValue() as string}</span> },
    { accessorKey: 'cost', header: 'Costo', cell: (info: CellContext<any, any>) => formatCurrency(info.getValue() as number) },
    { accessorKey: 'price', header: 'Precio', cell: (info: CellContext<any, any>) => <span style={{ fontWeight: 600, color: info.row.original.status === 'vigente' ? '#34d399' : 'var(--mt-text-muted)' }}>{formatCurrency(info.getValue() as number)}</span> },
    { accessorKey: 'supplier', header: 'Proveedor', cell: (info: CellContext<any, any>) => <div style={{ color: 'var(--mt-text-primary)' }}>{info.getValue() as string}</div> },
    { accessorKey: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
        const status = info.getValue() as string;
        const isActive = status === 'vigente';
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '9999px',
            fontSize: '12px', fontWeight: 500,
            backgroundColor: isActive ? '#142818' : 'var(--mt-surface-subtle)',
            border: `1px solid ${isActive ? '#1E4624' : 'var(--mt-border)'}`,
            color: isActive ? '#7CE38B' : 'var(--mt-text-muted)'
          }}>
            {isActive ? 'Vigente' : 'Descontinuado'}
          </span>
        );
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => (
        <button 
          onClick={() => handleOpenEdit(info.row.original)}
          style={{ background: 'transparent', border: 'none', color: 'var(--mt-text-secondary)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface-subtle)'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Edit2 size={16} />
        </button>
    )}
  ], []);

  const filteredProducts = products.filter(p => {
    const matchCat = catFilter === 'all' || catFilter === '' || p.category === catFilter;
    const matchStatus = statusFilter === 'all' || statusFilter === '' || p.status === statusFilter;
    return matchCat && matchStatus;
  });

  const uniqueCategories = Array.from(new Set(products.map(p => p.category)));

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: { sku: '', name: '', category: '', cost: 0, price: 0, supplier: '', status: 'vigente' }
  });

  const handleOpenNew = () => {
    setEditingProduct(null);
    form.reset({ sku: '', name: '', category: '', cost: 0, price: 0, supplier: '', status: 'vigente' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    form.reset({
      sku: p.sku, name: p.name, category: p.category, cost: p.cost, price: p.price, supplier: p.supplier, status: p.status as 'vigente' | 'descontinuado'
    });
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="mt-page-header" style={{ marginBottom: 0, alignItems: 'center' }}>
        <div>
          <h1 className="mt-page-title" style={{ fontSize: '28px', letterSpacing: '-0.8px', marginBottom: '4px' }}>Catálogo</h1>
          <p className="mt-page-subtitle" style={{ fontSize: '14px', color: 'var(--mt-text-secondary)' }}>Directorio de productos, costos y precios.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', 
            backgroundColor: '#FFFFFF', border: 'none', 
            padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', 
            color: '#000000', transition: 'all 0.2s', fontWeight: 600
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'} 
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={16} />
          <span style={{ fontSize: '14px' }}>Nuevo Producto</span>
        </button>
      </div>

      <div className="mt-panel" style={{ borderRadius: '12px', border: '1px solid var(--mt-border)', backgroundColor: 'var(--mt-surface)', padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ width: '200px' }}>
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
            <div style={{ width: '150px' }}>
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
        <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--mt-text-primary)', marginBottom: '8px', fontWeight: 500 }}>SKU</label>
              <Input type="text" placeholder="Ej. PROD-01" {...form.register('sku')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--mt-text-primary)', marginBottom: '8px', fontWeight: 500 }}>Nombre del producto</label>
              <Input type="text" placeholder="Ej. Monitor 24 pulgadas" {...form.register('name')} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--mt-text-primary)', marginBottom: '8px', fontWeight: 500 }}>Costo</label>
              <Input type="number" {...form.register('cost')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--mt-text-primary)', marginBottom: '8px', fontWeight: 500 }}>Precio de venta</label>
              <Input type="number" {...form.register('price')} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--mt-text-primary)', marginBottom: '8px', fontWeight: 500 }}>Categoría</label>
              <Input type="text" {...form.register('category')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--mt-text-primary)', marginBottom: '8px', fontWeight: 500 }}>Estado</label>
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
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--mt-text-primary)', marginBottom: '8px', fontWeight: 500 }}>Proveedor</label>
            <Input type="text" {...form.register('supplier')} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            {editingProduct?.id ? (
              <Button type="button" variant="danger" size="sm" onClick={handleDelete} style={{ gap: '6px' }}>
                <Trash2 size={14} /> Eliminar
              </Button>
            ) : <div />}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button type="button" variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" size="md">Guardar</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
