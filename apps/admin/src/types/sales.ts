export interface SalesLine {
  id: string;
  reportId: string;
  sku: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  amount: number;
  cost: number;
  profit: number;
  total: number;
}

export interface SalesReport {
  id: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  total: number;
  lines: SalesLine[];
  txtFileRef?: string;
  pdfFileRef?: string;
  importedAt: string;
}
