// Product analytics – KPIs, rankings, velocity

import type { SalesReport, SalesLine } from '../../types/sales';
import type { InventoryMovement } from '../inventory/types';
import type { Product } from '../../types/product';

export interface ProductKPI {
  sku: string;
  description: string;
  unitsSold: number;
  salesRevenue: number;
  reportedProfit: number;
  avgUnitsPerDay: number | null;
  daysSinceLastSale: number | null;
  inventoryCoverageDays: number | null;
}

/** Aggregate sales lines by product for a date range */
export const aggregateSalesByProduct = (
  incomes: SalesReport[],
  periodStart?: Date,
  periodEnd?: Date
): Map<string, { unitsSold: number; revenue: number; profit: number; lines: SalesLine[] }> => {
  const map = new Map<string, { unitsSold: number; revenue: number; profit: number; lines: SalesLine[] }>();

  incomes.forEach(report => {
    // If period filtering is needed, use report dates
    if (periodStart || periodEnd) {
      const reportDate = new Date(report.periodEnd || report.importedAt);
      if (periodStart && reportDate < periodStart) return;
      if (periodEnd && reportDate > periodEnd) return;
    }

    report.lines.forEach(line => {
      if (!line.sku) return;
      const existing = map.get(line.sku);
      if (existing) {
        existing.unitsSold += line.quantity;
        existing.revenue += line.total;
        existing.profit += line.profit;
        existing.lines.push(line);
      } else {
        map.set(line.sku, {
          unitsSold: line.quantity,
          revenue: line.total,
          profit: line.profit,
          lines: [line],
        });
      }
    });
  });

  return map;
};

/** Top products by units sold */
export const topByUnits = (salesMap: Map<string, { unitsSold: number; revenue: number; profit: number }>, products: Product[], limit = 5) => {
  return Array.from(salesMap.entries())
    .sort((a, b) => b[1].unitsSold - a[1].unitsSold)
    .slice(0, limit)
    .map(([sku, data]) => ({
      sku,
      description: products.find(p => p.sku === sku)?.description || sku,
      value: data.unitsSold,
      revenue: data.revenue,
    }));
};

/** Top products by revenue */
export const topByRevenue = (salesMap: Map<string, { unitsSold: number; revenue: number; profit: number }>, products: Product[], limit = 5) => {
  return Array.from(salesMap.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, limit)
    .map(([sku, data]) => ({
      sku,
      description: products.find(p => p.sku === sku)?.description || sku,
      value: data.revenue,
      units: data.unitsSold,
    }));
};

/** Top products by profit */
export const topByProfit = (salesMap: Map<string, { unitsSold: number; revenue: number; profit: number }>, products: Product[], limit = 5) => {
  return Array.from(salesMap.entries())
    .filter(([, data]) => data.profit > 0)
    .sort((a, b) => b[1].profit - a[1].profit)
    .slice(0, limit)
    .map(([sku, data]) => ({
      sku,
      description: products.find(p => p.sku === sku)?.description || sku,
      value: data.profit,
      revenue: data.revenue,
    }));
};

/** Simple sales velocity: units / days of data available */
export const getSalesVelocity = (
  sku: string,
  incomes: SalesReport[]
): { unitsPerDay: number; totalDays: number; totalUnits: number } | null => {
  let totalUnits = 0;
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  incomes.forEach(report => {
    report.lines.forEach(line => {
      if (line.sku !== sku || line.quantity <= 0) return;
      totalUnits += line.quantity;

      const d = new Date(report.periodEnd || report.importedAt);
      if (!minDate || d < minDate) minDate = d;
      if (!maxDate || d > maxDate) maxDate = d;
    });
  });

  if (totalUnits === 0 || !minDate || !maxDate) return null;

  // If only one report, use the period length (approximate)
  const totalDays = Math.max(1, Math.ceil(((maxDate as Date).getTime() - (minDate as Date).getTime()) / (1000 * 60 * 60 * 24)) || 30);

  return { unitsPerDay: totalUnits / totalDays, totalDays, totalUnits };
};

/** Compute inventory coverage in days */
export const getInventoryCoverageDays = (
  stock: number,
  velocity: { unitsPerDay: number } | null
): number | null => {
  if (!velocity || velocity.unitsPerDay <= 0 || stock <= 0) return null;
  return Math.round(stock / velocity.unitsPerDay);
};

/** Known inventory value */
export const getKnownInventoryValue = (products: Product[], movements: InventoryMovement[]): number => {
  let total = 0;
  products.forEach(p => {
    if (p.purchaseCost == null || !p.hasPurchaseHistory) return;
    const stock = movements
      .filter(m => m.productId === p.id)
      .reduce((s, m) => s + m.quantityDelta, 0);
    if (stock > 0) {
      total += stock * p.purchaseCost;
    }
  });
  return total;
};

/** Products without sales in X days (only if we have enough history) */
export const productsWithoutSales = (
  products: Product[],
  incomes: SalesReport[],
  days: number,
  referenceDate: Date = new Date()
): Product[] => {
  // Check if we have enough data to make this assertion
  const oldestReport = incomes.reduce<Date | null>((oldest, r) => {
    const d = new Date(r.periodStart || r.importedAt);
    if (!oldest || d < oldest) return d;
    return oldest;
  }, null);

  if (!oldestReport) return [];

  const dataSpanDays = Math.ceil((referenceDate.getTime() - oldestReport.getTime()) / (1000 * 60 * 60 * 24));
  if (dataSpanDays < days) return []; // Not enough history

  const cutoff = new Date(referenceDate.getTime() - days * 24 * 60 * 60 * 1000);

  const skusWithRecentSales = new Set<string>();
  incomes.forEach(report => {
    const reportDate = new Date(report.periodEnd || report.importedAt);
    if (reportDate >= cutoff) {
      report.lines.forEach(line => {
        if (line.quantity > 0) skusWithRecentSales.add(line.sku);
      });
    }
  });

  return products.filter(p => p.hasPurchaseHistory && !skusWithRecentSales.has(p.sku));
};
