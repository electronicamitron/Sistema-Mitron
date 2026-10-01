export type StorageZone = 'warehouse' | 'shelf' | 'drawer' | 'display' | 'counter' | 'office' | 'access' | 'other';

export interface StorageLocation {
  id: string;
  code: string;
  name: string;
  type: StorageZone;
  zone: string;
  description?: string;
  parentId?: string | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface InventoryPlacement {
  id: string;
  productId: string;
  locationId: string;
  quantity?: number | null;
}
