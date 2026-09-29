import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/Table';
import { StatusBadge } from '../components/ui/Badge';
import { PriceCalculatorModal } from '../components/domain/PriceCalculatorModal';
import { SupplierDrawer } from '../components/domain/SupplierDrawer';

export default function Administration() {
  const [activeTab, setActiveTab] = useState<'ingresos' | 'gastos' | 'proveedores'>('ingresos');
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);

  return (
    <div>
      <div className="mt-page-header">
        <div>
          <h1 className="mt-page-title">Administración</h1>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <button
              onClick={() => setActiveTab('ingresos')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'ingresos' ? 'var(--mt-text-primary)' : 'var(--mt-text-secondary)',
                fontWeight: activeTab === 'ingresos' ? 600 : 500,
                cursor: 'pointer',
                paddingBottom: '4px',
                borderBottom: activeTab === 'ingresos' ? '2px solid var(--mt-text-primary)' : '2px solid transparent'
              }}
            >
              Ingresos
            </button>
            <button
              onClick={() => setActiveTab('gastos')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'gastos' ? 'var(--mt-text-primary)' : 'var(--mt-text-secondary)',
                fontWeight: activeTab === 'gastos' ? 600 : 500,
                cursor: 'pointer',
                paddingBottom: '4px',
                borderBottom: activeTab === 'gastos' ? '2px solid var(--mt-text-primary)' : '2px solid transparent'
              }}
            >
              Gastos
            </button>
            <button
              onClick={() => setActiveTab('proveedores')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'proveedores' ? 'var(--mt-text-primary)' : 'var(--mt-text-secondary)',
                fontWeight: activeTab === 'proveedores' ? 600 : 500,
                cursor: 'pointer',
                paddingBottom: '4px',
                borderBottom: activeTab === 'proveedores' ? '2px solid var(--mt-text-primary)' : '2px solid transparent'
              }}
            >
              Proveedores
            </button>
          </div>
        </div>
        <Button variant="primary" onClick={() => alert('Acción de interfaz visual. Sin conexión a backend.')}>
          Importar archivo
        </Button>
      </div>

      {activeTab === 'ingresos' && (
        <DataTable columns={['Período', 'Archivo', 'Importe', 'Total c/IVA', 'Estado', 'Acciones']}>
          <tr>
            <td>Julio 2026</td>
            <td>ventas_mes_actual.txt</td>
            <td>$50,000.00</td>
            <td>$58,000.00</td>
            <td><StatusBadge status="success">Verificado</StatusBadge></td>
            <td>
              <Button variant="ghost" size="sm" onClick={() => setIsCalcOpen(true)}>Calcular precio</Button>
            </td>
          </tr>
        </DataTable>
      )}

      {activeTab === 'gastos' && (
        <DataTable columns={['Fecha', 'Proveedor', 'Factura', 'Clasificación', 'Total', 'Estado', 'Acciones']}>
          <tr>
            <td>08/07/2026</td>
            <td>PROVEEDOR EJEMPLO S.A. DE C.V.</td>
            <td>RF-131812</td>
            <td>Mercancía</td>
            <td>$10,000.00</td>
            <td><StatusBadge status="warning">PPD</StatusBadge></td>
            <td>
              <Button variant="ghost" size="sm" onClick={() => setIsCalcOpen(true)}>Calcular precio</Button>
            </td>
          </tr>
        </DataTable>
      )}

      {activeTab === 'proveedores' && (
        <DataTable columns={['Proveedor', 'RFC', 'Total Comprado', 'Última Compra', 'Acciones']}>
          <tr>
            <td>PROVEEDOR EJEMPLO S.A. DE C.V.</td>
            <td>EXA123456789</td>
            <td>$10,000.00</td>
            <td>08/07/2026</td>
            <td>
              <Button variant="secondary" size="sm" onClick={() => setIsSupplierOpen(true)}>Ver Ficha</Button>
            </td>
          </tr>
        </DataTable>
      )}

      <PriceCalculatorModal 
        isOpen={isCalcOpen} 
        onClose={() => setIsCalcOpen(false)} 
        itemName="Ejemplo de Producto" 
        cost={100} 
      />
      <SupplierDrawer 
        isOpen={isSupplierOpen} 
        onClose={() => setIsSupplierOpen(false)} 
        supplierName="PROVEEDOR EJEMPLO S.A. DE C.V." 
        rfc="EXA123456789" 
      />
    </div>
  );
}
