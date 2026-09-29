# Contratos de Datos (Data Contracts)

Para mantener los componentes UI agnósticos, estos son los modelos de datos que requerirán:

## Supplier
```typescript
interface SupplierContract {
  id: string;
  rfc: string;
  name: string;
  totalPurchased: number;
  lastPurchaseDate: string;
}
```

## Invoice / Sales
```typescript
interface InvoiceContract {
  id: string;
  date: string;
  supplierName: string;
  total: number;
  paymentMethod: 'PPD' | 'PUE';
  status: 'Vigente' | 'Cancelado' | 'Pagado' | 'Pendiente';
}
```

## Inventory Item
```typescript
interface InventoryContract {
  sku: string;
  productName: string;
  suppliers: SupplierContract[]; 
  inputs: number;
  outputs: number;
  balance: number;
  status: 'Disponible' | 'Stock bajo' | 'Sin existencias' | 'Revisar existencias';
  lowStockLimit?: number; // Opcional, si no está configurado se utiliza comportamiento por defecto
}
```

Estos contratos permiten conectar cualquier backend en el futuro sin modificar la UI.
