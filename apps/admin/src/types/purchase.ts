export type CostType = 'MERCHANDISE' | 'PURCHASE_DIRECT_COST' | 'OPERATING_EXPENSE' | 'OTHER_NON_STOCK';

export interface PurchaseLineTax {
  tax: string; // IVA, ISR, etc.
  type: 'traslado' | 'retencion';
  rate: number;
  amount: number;
}

export interface PurchaseLine {
  id: string;
  documentId: string;
  sku: string;
  description: string;
  quantity: number;
  unit: string;
  unitCode: string;
  unitCost: number;
  amount: number;
  stockable: boolean;
  costType?: CostType;
  taxes?: PurchaseLineTax[];
}

export type PaymentStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA';

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  reference?: string;
}

export interface PurchaseDocument {
  id: string;
  uuid?: string;
  serie?: string;
  folio?: string;
  date: string;
  supplierRfc: string;
  supplierName: string;
  subtotal: number;
  iva?: number;
  total: number;
  currency?: string;
  lines: PurchaseLine[];
  xmlFileRef?: string;
  pdfFileRef?: string;
  importedAt: string;
  // Raw XML for download
  rawXml?: string;
  // Accounts payable fields
  dueDate?: string;
  payments?: PaymentRecord[];
}
