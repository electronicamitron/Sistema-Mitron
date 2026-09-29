import { useState } from 'react';
import { FilterBar, Select, SearchField } from '../components/ui/Form';
import { DataTable } from '../components/ui/Table';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { StockConfigModal } from '../components/domain/StockConfigModal';

export default function Inventory() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <div>
      <div className="mt-page-header">
        <div>
          <h1 className="mt-page-title">Inventario</h1>
          <p className="mt-page-subtitle">Existencias y movimientos</p>
        </div>
      </div>

      <FilterBar>
        <SearchField placeholder="Buscar producto..." />
        <Select onChange={() => alert('Acción de interfaz visual. Sin conexión a backend.')} options={[{label: 'Todos los proveedores', value: ''}]} />
        <Select onChange={() => alert('Acción de interfaz visual. Sin conexión a backend.')} options={[{label: 'Mes', value: ''}]} />
        <Select onChange={() => alert('Acción de interfaz visual. Sin conexión a backend.')} options={[{label: 'Año', value: ''}]} />
        <Select onChange={() => alert('Acción de interfaz visual. Sin conexión a backend.')} options={[{label: 'Todos los estados', value: ''}]} />
      </FilterBar>

      <DataTable columns={['Producto / SKU', 'Proveedor', 'Entradas', 'Salidas', 'Saldo', 'Estado', 'Acciones']}>
        <tr>
          <td>
            <strong>PRODUCTO DE EJEMPLO</strong><br/>
            <span style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>PROD-001</span>
          </td>
          <td>PROVEEDOR EJEMPLO S.A. DE C.V.</td>
          <td>15</td>
          <td>3</td>
          <td><strong>12</strong></td>
          <td><StatusBadge status="success">Disponible</StatusBadge></td>
          <td>
            <Button variant="ghost" size="sm" onClick={() => setIsConfigOpen(true)}>Configurar límite</Button>
          </td>
        </tr>
      </DataTable>

      <StockConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        itemName="PRODUCTO DE EJEMPLO" 
        sku="PROD-001" 
        currentLimit={5} 
      />
    </div>
  );
}
