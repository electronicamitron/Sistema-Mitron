import type { InventoryMovement } from './types';


export const getRawStock = (productId: string, movements: InventoryMovement[]): number => {
  return movements
    .filter(m => m.productId === productId)
    .reduce((sum, m) => sum + m.quantityDelta, 0);
};

export const getDisplayedStock = (rawStock: number): number => {
  return Math.max(0, rawStock);
};

export type InventoryStatus = 'SIN EXISTENCIAS' | 'STOCK BAJO' | 'DISPONIBLE' | 'SIN HISTORIAL DE COMPRA';

export const getInventoryStatus = (rawStock: number, hasPurchaseHistory: boolean): InventoryStatus => {
  if (!hasPurchaseHistory) return 'SIN HISTORIAL DE COMPRA';
  if (rawStock <= 0) return 'SIN EXISTENCIAS';
  if (rawStock > 0 && rawStock < 3) return 'STOCK BAJO';
  return 'DISPONIBLE';
};

export const hasIncompleteHistory = (_rawStock: number, hasPurchaseHistory: boolean): boolean => {
  return !hasPurchaseHistory;
};
