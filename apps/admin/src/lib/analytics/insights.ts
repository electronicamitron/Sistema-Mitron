// Dashboard insights – deterministic, data-driven, max 5

import type { PeriodFinancials } from './financial';
import type { Product } from '../../types/product';
import type { PurchaseDocument } from '../../types/purchase';
import type { SupplyRecord } from '../../types/supply';
import type { ProductRequest } from '../../types/supply';
import type { InventoryMovement } from '../inventory/types';
import { getRawStock, getInventoryStatus } from '../inventory/selectors';

export interface Insight {
  id: string;
  text: string;
  priority: number; // lower = more important
  type: 'warning' | 'info' | 'alert';
}

export const generateInsights = (
  financials: PeriodFinancials,
  prevFinancials: PeriodFinancials | null,
  products: Product[],
  movements: InventoryMovement[],
  expenses: PurchaseDocument[],
  supplyRecords: SupplyRecord[],
  productRequests: ProductRequest[],
  today: Date = new Date()
): Insight[] => {
  const insights: Insight[] = [];

  // 1. Stock risks
  let lowStock = 0;
  let outOfStock = 0;
  products.forEach(p => {
    if (!p.hasPurchaseHistory) return;
    const raw = getRawStock(p.id, movements);
    const status = getInventoryStatus(raw, p.hasPurchaseHistory);
    if (status === 'STOCK BAJO') lowStock++;
    if (status === 'SIN EXISTENCIAS') outOfStock++;
  });

  if (outOfStock > 0) {
    insights.push({
      id: 'out-of-stock',
      text: `${outOfStock} producto${outOfStock > 1 ? 's' : ''} agotado${outOfStock > 1 ? 's' : ''} con historial de compra.`,
      priority: 1,
      type: 'alert',
    });
  }

  if (lowStock > 0) {
    insights.push({
      id: 'low-stock',
      text: `${lowStock} producto${lowStock > 1 ? 's' : ''} con stock bajo.`,
      priority: 2,
      type: 'warning',
    });
  }

  // 2. Accounts due soon
  const fifteenDaysFromNow = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
  const dueSoon = expenses.filter(e => {
    if (!e.dueDate) return false;
    const paid = e.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
    const remaining = e.total - paid;
    if (remaining <= 0) return false;
    const due = new Date(e.dueDate);
    return due <= fifteenDaysFromNow;
  });

  if (dueSoon.length > 0) {
    insights.push({
      id: 'accounts-due',
      text: `${dueSoon.length} factura${dueSoon.length > 1 ? 's' : ''} por pagar en los próximos 15 días.`,
      priority: 3,
      type: 'warning',
    });
  }

  // 3. Growth/decline vs previous period
  if (prevFinancials && prevFinancials.totalIncome > 0 && financials.totalIncome > 0) {
    const pctChange = ((financials.totalIncome - prevFinancials.totalIncome) / prevFinancials.totalIncome) * 100;
    if (Math.abs(pctChange) >= 1) {
      insights.push({
        id: 'income-change',
        text: pctChange > 0
          ? `Ingresos aumentaron ${pctChange.toFixed(1)}% frente al periodo anterior.`
          : `Ingresos disminuyeron ${Math.abs(pctChange).toFixed(1)}% frente al periodo anterior.`,
        priority: 4,
        type: pctChange > 0 ? 'info' : 'warning',
      });
    }
  }

  // 4. Pending supply
  const pendingSupply = supplyRecords.filter(s =>
    s.status === 'PEDIDO' || s.status === 'EN TRÁNSITO'
  );
  if (pendingSupply.length > 0) {
    insights.push({
      id: 'pending-supply',
      text: `${pendingSupply.length} pedido${pendingSupply.length > 1 ? 's' : ''} de mercancía por recibir.`,
      priority: 5,
      type: 'info',
    });
  }

  // 5. Pending requests
  const pendingReqs = productRequests.filter(r =>
    r.status === 'PENDIENTE' || r.status === 'EN PROCESO'
  );
  if (pendingReqs.length > 0) {
    insights.push({
      id: 'pending-requests',
      text: `${pendingReqs.length} solicitud${pendingReqs.length > 1 ? 'es' : ''} de producto${pendingReqs.length > 1 ? 's' : ''} pendiente${pendingReqs.length > 1 ? 's' : ''}.`,
      priority: 6,
      type: 'info',
    });
  }

  // Purchases as % of income
  if (financials.totalIncome > 0 && financials.totalPurchases > 0) {
    const purchasePct = (financials.totalPurchases / financials.totalIncome) * 100;
    insights.push({
      id: 'purchase-ratio',
      text: `Las compras representaron ${purchasePct.toFixed(1)}% de los ingresos.`,
      priority: 7,
      type: 'info',
    });
  }

  return insights.sort((a, b) => a.priority - b.priority).slice(0, 5);
};
