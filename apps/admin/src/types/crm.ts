export interface Client {
  id: string;
  name: string;
  type?: 'FISICA' | 'MORAL' | 'SIN ESPECIFICAR';
  rfc?: string;
  phone?: string;
  email?: string;
  status: 'PROSPECTO' | 'CLIENTE' | 'INACTIVO';
  createdAt: string;
}

export interface Quote {
  id: string;
  clientId: string;
  date: string;
  validUntil: string;
  status: 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA';
  lines: QuoteLine[];
  subtotal: number;
  iva: number;
  total: number;
  notes?: string;
}

export interface QuoteLine {
  productId: string;
  description: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface CRMTask {
  id: string;
  title: string;
  reason: string;
  relatedTo: 'GENERAL' | 'COTIZACION' | 'SOLICITUD';
  dueDate?: string;
  status: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';
  clientId?: string;
  createdAt: string;
}
