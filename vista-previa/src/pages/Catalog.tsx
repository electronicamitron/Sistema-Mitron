
import { DataTable } from '../components/ui/Table';
import { FilterBar, SearchField, Select } from '../components/ui/Form';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function Catalog() {
  return (
    <div>
      <div className="mt-page-header">
        <div>
          <h1 className="mt-page-title">Catálogo</h1>
          <p className="mt-page-subtitle">Productos, precios y costos</p>
        </div>
        <Button variant="primary" onClick={() => alert('Acción de interfaz visual. Sin conexión a backend.')}>Nuevo Producto</Button>
      </div>

      <FilterBar>
        <SearchField placeholder="Buscar producto o SKU..." />
        <Select onChange={() => alert('Acción de interfaz visual. Sin conexión a backend.')} options={[{label: 'Todas las categorías', value: ''}, {label: 'Electrónica', value: 'elec'}]} />
        <Select onChange={() => alert('Acción de interfaz visual. Sin conexión a backend.')} options={[{label: 'Todos los proveedores', value: ''}]} />
      </FilterBar>

      <DataTable columns={['SKU', 'Descripción', 'Categoría', 'Costo', 'Precio', 'Proveedores', 'Estado']}>
        <tr>
          <td><strong>PROD-001</strong></td>
          <td>PRODUCTO DE EJEMPLO</td>
          <td>Herramientas</td>
          <td>$20.00</td>
          <td>$51.72</td>
          <td>PROVEEDOR EJEMPLO S.A. DE C.V.<br/><span style={{ fontSize: '10px', color: 'var(--mt-text-secondary)' }}>(SKU Prov: PROD-001)</span></td>
          <td><StatusBadge status="success">Vigente</StatusBadge></td>
        </tr>
      </DataTable>
    </div>
  );
}
