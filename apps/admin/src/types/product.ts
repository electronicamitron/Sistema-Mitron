export interface Product {
  id: string;
  sku: string;
  description: string;
  unit: string;
  category: string | null;
  purchaseCost: number | null;
  salePrice: number | null;
  salePriceSource: 'REPORT' | 'MANUAL';
  lastPurchaseAt: string | null;
  hasPurchaseHistory: boolean;
  sources: ('XML' | 'TXT')[];
  // New classification fields – all optional for retrocompatibility
  categoryId?: string | null;
  subcategoryId?: string | null;
  brandId?: string | null;
  tags?: string[];
}
