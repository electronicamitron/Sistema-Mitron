export type MovementType = 'PURCHASE' | 'SALE';

export interface InventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantityDelta: number;
  occurredAt: string;
  sourceType: 'XML' | 'TXT';
  sourceId: string;
  sourceLineId: string;
}
