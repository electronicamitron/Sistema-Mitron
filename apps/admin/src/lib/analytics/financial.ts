// Financial analytics – derives monetary aggregates from documents

import type { PurchaseDocument, CostType } from '../../types/purchase';
import type { SalesReport } from '../../types/sales';

/** Calculate line total with taxes: importe + trasladados - retenciones */
export const getLineTotalWithTaxes = (line: { amount: number; taxes?: Array<{ type: string; amount: number }> }): number => {
  if (!line.taxes || line.taxes.length === 0) return line.amount;
  const traslados = line.taxes.filter(t => t.type === 'traslado').reduce((s, t) => s + t.amount, 0);
  const retenciones = line.taxes.filter(t => t.type === 'retencion').reduce((s, t) => s + t.amount, 0);
  return line.amount + traslados - retenciones;
};

/** Effective cost type for a line considering invoice context */
export const getEffectiveCostType = (line: { stockable: boolean; costType?: CostType }, invoiceHasStockable: boolean): CostType => {
  if (line.costType) return line.costType;
  if (line.stockable) return 'MERCHANDISE';
  if (invoiceHasStockable) return 'PURCHASE_DIRECT_COST';
  return 'OPERATING_EXPENSE';
};

/** Check if invoice has at least one stockable line */
export const invoiceHasStockableLines = (doc: PurchaseDocument): boolean => {
  return doc.lines.some(l => l.stockable);
};

/** Classify all lines of a document and return sums by cost type */
export const classifyDocument = (doc: PurchaseDocument): Record<CostType, number> => {
  const hasStockable = invoiceHasStockableLines(doc);
  const result: Record<CostType, number> = {
    MERCHANDISE: 0,
    PURCHASE_DIRECT_COST: 0,
    OPERATING_EXPENSE: 0,
    OTHER_NON_STOCK: 0,
  };

  doc.lines.forEach(line => {
    const ct = getEffectiveCostType(line, hasStockable);
    result[ct] += getLineTotalWithTaxes(line);
  });

  return result;
};

export interface PeriodFinancials {
  totalIncome: number;
  totalPurchases: number; // MERCHANDISE + PURCHASE_DIRECT_COST
  totalOperatingExpenses: number;
  totalMerchandise: number;
  totalDirectCosts: number;
  
  // Rendimiento
  totalSalesCost: number | null; // Derived from Income - Profit
  knownSalesCost: number | null; // From explicit l.cost
  reportedProfit: number | null;
  grossMargin: number | null;
  estimatedResult: number | null;
}

export const getNormalizedDate = (dateStr: string): { year: number, month: number, day: number } | null => {
  if (!dateStr) return null;
  
  // Try strict YYYY-MM-DD
  const ymdMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    return { year: Number(ymdMatch[1]), month: Number(ymdMatch[2]) - 1, day: Number(ymdMatch[3]) };
  }

  // Try finding month names (for corrupted data like "01-Jul-2026")
  const monthMap: Record<string, number> = {
    'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
  };
  const lowerDate = dateStr.toLowerCase();
  for (const [name, num] of Object.entries(monthMap)) {
    if (lowerDate.includes(name)) {
      const yMatch = dateStr.match(/\b(20\d{2})\b/);
      const year = yMatch ? Number(yMatch[1]) : new Date().getFullYear();
      return { year, month: num, day: 1 };
    }
  }
  
  return null;
};

/** Filter items by period (year-month string like '2026-6') */
const isInPeriod = (dateStr: string, periodYear: number, periodMonth: number): boolean => {
  const norm = getNormalizedDate(dateStr);
  if (!norm) return false;
  return norm.year === periodYear && norm.month === periodMonth;
};

const isInYear = (dateStr: string, year: number): boolean => {
  const norm = getNormalizedDate(dateStr);
  if (!norm) return false;
  return norm.year === year;
};

export const getDocumentDate = (item: { periodEnd?: string; date?: string; importedAt?: string }): string => {
  return item.periodEnd || item.date || item.importedAt || new Date().toISOString();
};

export const computePeriodFinancials = (
  incomes: SalesReport[],
  expenses: PurchaseDocument[],
  periodYear: number,
  periodMonth: number
): PeriodFinancials => {
  const filteredIncomes = incomes.filter(i => isInPeriod(getDocumentDate(i), periodYear, periodMonth));
  const filteredExpenses = expenses.filter(e => isInPeriod(getDocumentDate(e), periodYear, periodMonth));

  const totalIncome = filteredIncomes.reduce((s, i) => s + i.total, 0);
  
  let hasProfitData = false;
  let reportedProfitRaw = 0;
  let totalSalesCostRaw = 0;
  
  filteredIncomes.forEach(i => {
    i.lines.forEach(l => {
      if (l.profit !== undefined && l.cost !== undefined && (l.profit > 0 || l.cost > 0)) {
        hasProfitData = true;
      }
      reportedProfitRaw += (l.profit || 0);
      totalSalesCostRaw += (l.cost || 0);
    });
  });

  let totalMerchandise = 0;
  let totalDirectCosts = 0;
  let totalOperatingExpenses = 0;

  filteredExpenses.forEach(doc => {
    const classified = classifyDocument(doc);
    totalMerchandise += classified.MERCHANDISE;
    totalDirectCosts += classified.PURCHASE_DIRECT_COST;
    totalOperatingExpenses += classified.OPERATING_EXPENSE + classified.OTHER_NON_STOCK;
  });

  const totalPurchases = totalMerchandise + totalDirectCosts;

  const reportedProfit = hasProfitData ? reportedProfitRaw : null;
  const knownSalesCost = hasProfitData ? totalSalesCostRaw : null;
  const totalSalesCost = hasProfitData ? (totalIncome - reportedProfitRaw) : null;
  const grossMargin = hasProfitData && totalIncome > 0 ? (reportedProfitRaw / totalIncome) : null;
  const estimatedResult = hasProfitData ? reportedProfitRaw - totalOperatingExpenses : null;

  return {
    totalIncome,
    totalPurchases,
    totalOperatingExpenses,
    totalMerchandise,
    totalDirectCosts,
    totalSalesCost,
    knownSalesCost,
    reportedProfit,
    grossMargin,
    estimatedResult,
  };
};

export const computeYearFinancials = (
  incomes: SalesReport[],
  expenses: PurchaseDocument[],
  year: number
): PeriodFinancials => {
  const filteredIncomes = incomes.filter(i => isInYear(getDocumentDate(i), year));
  const filteredExpenses = expenses.filter(e => isInYear(getDocumentDate(e), year));

  const totalIncome = filteredIncomes.reduce((s, i) => s + i.total, 0);
  
  let hasProfitData = false;
  let reportedProfitRaw = 0;
  let totalSalesCostRaw = 0;
  
  filteredIncomes.forEach(i => {
    i.lines.forEach(l => {
      if (l.profit !== undefined && l.cost !== undefined && (l.profit > 0 || l.cost > 0)) {
        hasProfitData = true;
      }
      reportedProfitRaw += (l.profit || 0);
      totalSalesCostRaw += (l.cost || 0);
    });
  });

  let totalMerchandise = 0;
  let totalDirectCosts = 0;
  let totalOperatingExpenses = 0;

  filteredExpenses.forEach(doc => {
    const classified = classifyDocument(doc);
    totalMerchandise += classified.MERCHANDISE;
    totalDirectCosts += classified.PURCHASE_DIRECT_COST;
    totalOperatingExpenses += classified.OPERATING_EXPENSE + classified.OTHER_NON_STOCK;
  });

  const totalPurchases = totalMerchandise + totalDirectCosts;
  
  const reportedProfit = hasProfitData ? reportedProfitRaw : null;
  const knownSalesCost = hasProfitData ? totalSalesCostRaw : null;
  const totalSalesCost = hasProfitData ? (totalIncome - reportedProfitRaw) : null;
  const grossMargin = hasProfitData && totalIncome > 0 ? (reportedProfitRaw / totalIncome) : null;
  const estimatedResult = hasProfitData ? reportedProfitRaw - totalOperatingExpenses : null;

  return {
    totalIncome,
    totalPurchases,
    totalOperatingExpenses,
    totalMerchandise,
    totalDirectCosts,
    totalSalesCost,
    knownSalesCost,
    reportedProfit,
    grossMargin,
    estimatedResult,
  };
};

export const buildMonthChartData = (
  incomes: SalesReport[],
  expenses: PurchaseDocument[],
  year: number,
  month: number
): Array<{ name: string; sortKey: number; ingresos: number; compras: number; gastos: number, costoVenta: number, utilidad: number }> => {
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const map = new Map<string, { sortKey: number; name: string; ingresos: number; compras: number; gastos: number, costoVenta: number, utilidad: number }>();

  const addToMap = (dateStr: string, type: 'ingresos' | 'compras' | 'gastos' | 'costoVenta' | 'utilidad', amount: number) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return;
    if (d.getFullYear() !== year || d.getMonth() !== month) return;
    
    // For Month view, group all TXT imports (which are generally month-long) into a single period label if needed.
    // The prompt says: "En vista mensual NO graficar los $166,372.21 como un evento puntual “30 jul”. Mostrarlo como agregado del periodo: “Julio 2026” o “01–31 jul 2026”"
    // Since the text report doesn't represent a single day, let's put it on a special "Mes" label.
    let name = `${d.getDate().toString().padStart(2, '0')} ${monthNames[d.getMonth()]}`;
    let sortKey = d.getTime();
    
    // If it's a txt import (often end of month), group them by "Periodo"
    // To identify if it's the full month report, usually they have a periodEnd, but let's just group by month if it's month-based.
    
    if (!map.has(name)) map.set(name, { sortKey, name, ingresos: 0, compras: 0, gastos: 0, costoVenta: 0, utilidad: 0 });
    map.get(name)![type] += amount;
  };

  incomes.forEach(i => {
    if (isInPeriod(getDocumentDate(i), year, month)) {
      // Grouping all incomes into a "Mensual" bucket for the chart as requested:
      // "En vista mensual NO graficar los $166,372.21 como un evento puntual 30 jul. Mostrarlo como agregado del periodo: 01–31 jul 2026"
      const name = `01–31 ${monthNames[month]}`;
      const sortKey = new Date(year, month, 15).getTime(); // Put it in the middle of the month
      if (!map.has(name)) map.set(name, { sortKey, name, ingresos: 0, compras: 0, gastos: 0, costoVenta: 0, utilidad: 0 });
      map.get(name)!.ingresos += i.total;
      
      let p = 0;
      let c = 0;
      i.lines.forEach(l => {
        p += l.profit || 0;
      });
      // Cost of sales is derived from total - profit
      c = i.total - p;
      map.get(name)!.utilidad += p;
      map.get(name)!.costoVenta += c;
    }
  });

  expenses.forEach(e => {
    if (isInPeriod(getDocumentDate(e), year, month)) {
      const classified = classifyDocument(e);
      addToMap(getDocumentDate(e), 'compras', classified.MERCHANDISE + classified.PURCHASE_DIRECT_COST);
      addToMap(getDocumentDate(e), 'gastos', classified.OPERATING_EXPENSE + classified.OTHER_NON_STOCK);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.sortKey - b.sortKey);
};

/** Build chart data for a year – grouped by month */
export const buildYearChartData = (
  incomes: SalesReport[],
  expenses: PurchaseDocument[],
  year: number
): Array<{ name: string; sortKey: number; ingresos: number; compras: number; gastos: number, costoVenta: number, utilidad: number }> => {
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const data: Array<{ name: string; sortKey: number; ingresos: number; compras: number; gastos: number, costoVenta: number, utilidad: number }> = [];

  for (let m = 0; m < 12; m++) {
    const fi = incomes.filter(i => isInPeriod(getDocumentDate(i), year, m));
    const fe = expenses.filter(e => isInPeriod(getDocumentDate(e), year, m));

    const ingresos = fi.reduce((s, i) => s + i.total, 0);
    
    let utilidad = 0;
    fi.forEach(i => i.lines.forEach(l => utilidad += (l.profit || 0)));
    let costoVenta = ingresos - utilidad;
    
    let compras = 0;
    let gastos = 0;
    fe.forEach(e => {
      const c = classifyDocument(e);
      compras += c.MERCHANDISE + c.PURCHASE_DIRECT_COST;
      gastos += c.OPERATING_EXPENSE + c.OTHER_NON_STOCK;
    });

    if (ingresos > 0 || compras > 0 || gastos > 0 || utilidad > 0 || costoVenta > 0) {
      data.push({ name: monthNames[m], sortKey: m, ingresos, compras, gastos, costoVenta, utilidad });
    }
  }

  return data;
};
