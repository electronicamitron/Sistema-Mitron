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
}
