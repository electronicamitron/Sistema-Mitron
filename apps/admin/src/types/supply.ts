// Supply chain types

export type SupplyStatus = 'POR COMPRAR' | 'PEDIDO' | 'EN TRÁNSITO' | 'PARCIAL' | 'RECIBIDO' | 'CANCELADO';

export interface SupplyRecord {
  id: string;
  productId: string;
  supplierId?: string;
  quantityRequested: number;
  quantityOrdered: number;
  quantityReceived: number;
  status: SupplyStatus;
  createdAt: string;
  expectedDate?: string;
  notes?: string;
  sourceRequestId?: string;
}

export type ProductRequestStatus = 'PENDIENTE' | 'EN PROCESO' | 'RESUELTA' | 'CERRADA';

export interface ProductRequest {
  id: string;
  description: string;
  brandModel?: string;
  quantityRequested: number;
  clientId?: string;
  date: string;
  possibleSupplierId?: string;
  estimatedCost?: number;
  status: ProductRequestStatus;
  relatedRequestIds?: string[];
}
