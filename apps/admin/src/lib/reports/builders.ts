// Report builders

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { SalesReport } from '../../types/sales';
import type { PurchaseDocument } from '../../types/purchase';
import type { Product } from '../../types/product';
import type { Supplier } from '../../types/supplier';
import type { SupplyRecord, ProductRequest } from '../../types/supply';
import type { Client, Quote, CRMTask } from '../../types/crm';
import type { InventoryMovement } from '../inventory/types';
import { computePeriodFinancials, computeYearFinancials } from '../analytics/financial';
import { aggregateSalesByProduct, topByUnits, topByRevenue, getKnownInventoryValue } from '../analytics/products';
import { getRawStock, getInventoryStatus } from '../inventory/selectors';
import { getCategoryName, getSubcategoryName } from '../catalog/categories';
import { formatDateHuman } from '../utils';
import type { Brand } from '../catalog/brands';
import { getBrandName } from '../catalog/brands';

const fmt = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

export interface ReportParams {
  periodType: 'month' | 'year';
  year: number;
  month: number; // 0-indexed
  reportType: 'executive' | 'detailed';
}

export const generateExecutivePDF = (
  params: ReportParams,
  incomes: SalesReport[],
  expenses: PurchaseDocument[],
  products: Product[],
  movements: InventoryMovement[],
  _suppliers: Supplier[],
  _supplyRecords: SupplyRecord[],
  _productRequests: ProductRequest[],
): void => {
  const doc = new jsPDF();
  const financials = params.periodType === 'year'
    ? computeYearFinancials(incomes, expenses, params.year)
    : computePeriodFinancials(incomes, expenses, params.year, params.month);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const periodLabel = params.periodType === 'year' ? `${params.year}` : `${monthNames[params.month]} ${params.year}`;

  doc.setFontSize(20);
  doc.text('Sistema Mitron', 14, 22);
  doc.setFontSize(14);
  doc.text('Resumen Ejecutivo', 14, 30);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Periodo: ${periodLabel}`, 14, 38);
  doc.text(`Generado: ${formatDateHuman(new Date().toISOString())}`, 14, 44);

  doc.setTextColor(0);
  autoTable(doc, {
    startY: 52,
    head: [['Indicador', 'Valor']],
    body: [
      ['Ingresos', fmt(financials.totalIncome)],
      ['Compras (Mercancía + Costos directos)', fmt(financials.totalPurchases)],
      ['Gastos operativos', fmt(financials.totalOperatingExpenses)],
      ['Resultado estimado', fmt(financials.estimatedResult || 0)],
      ...(financials.reportedProfit && financials.reportedProfit > 0 ? [['Utilidad reportada', fmt(financials.reportedProfit)]] : []),
      ['Valor de inventario conocido', fmt(getKnownInventoryValue(products, movements))],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 44, 45] }
  });

  let nextY = (doc as any).lastAutoTable.finalY + 12;

  // Top products
  const salesMap = aggregateSalesByProduct(incomes);
  const topUnits = topByUnits(salesMap, products, 5);
  const topRev = topByRevenue(salesMap, products, 5);

  if (topUnits.length > 0) {
    doc.setFontSize(12);
    doc.text('Más vendidos por unidades', 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [['Producto', 'SKU', 'Unidades']],
      body: topUnits.map(p => [p.description, p.sku, p.value.toString()]),
      theme: 'striped',
      headStyles: { fillColor: [41, 44, 45] }
    });
    nextY = (doc as any).lastAutoTable.finalY + 8;
  }

  if (topRev.length > 0) {
    doc.setFontSize(12);
    doc.text('Mayor ingreso', 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [['Producto', 'SKU', 'Ingreso']],
      body: topRev.map(p => [p.description, p.sku, fmt(p.value)]),
      theme: 'striped',
      headStyles: { fillColor: [41, 44, 45] }
    });
    nextY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Inventory summary
  let outOfStock = 0, lowStock = 0, noHistory = 0;
  products.forEach(p => {
    const raw = getRawStock(p.id, movements);
    if (!p.hasPurchaseHistory) { noHistory++; return; }
    const st = getInventoryStatus(raw, p.hasPurchaseHistory);
    if (st === 'SIN EXISTENCIAS') outOfStock++;
    if (st === 'STOCK BAJO') lowStock++;
  });

  if (nextY > 250) { doc.addPage(); nextY = 20; }

  doc.setFontSize(12);
  doc.text('Inventario', 14, nextY);
  autoTable(doc, {
    startY: nextY + 4,
    head: [['Estado', 'Cantidad']],
    body: [
      ['Agotados', outOfStock.toString()],
      ['Stock bajo', lowStock.toString()],
      ['Sin historial', noHistory.toString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [41, 44, 45] }
  });
  nextY = (doc as any).lastAutoTable.finalY + 8;

  // Accounts payable
  const accountsDue = expenses.map(e => ({
    ...e,
    paid: e.payments?.reduce((acc, p) => acc + p.amount, 0) || 0
  })).filter(e => {
    if (!e.dueDate) return false;
    const remaining = e.total - e.paid;
    return remaining > 0;
  });

  if (accountsDue.length > 0 && nextY < 250) {
    doc.text('Cuentas por pagar pendientes', 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [['Proveedor', 'Factura', 'Total', 'Pagado', 'Pendiente']],
      body: accountsDue.slice(0, 10).map(e => [
        e.supplierName,
        `${e.serie || ''}${e.folio || ''}`,
        fmt(e.total),
        fmt(e.paid),
        fmt(e.total - e.paid),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 44, 45] }
    });
    nextY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Indicators section
  const indicators: string[] = [];
  if (financials.totalIncome > 0 && financials.totalPurchases > 0) {
    indicators.push(`Las compras representaron ${((financials.totalPurchases / financials.totalIncome) * 100).toFixed(1)}% de los ingresos.`);
  }
  if (outOfStock > 0) indicators.push(`${outOfStock} productos se encuentran agotados.`);
  if (lowStock > 0) indicators.push(`${lowStock} productos con stock bajo.`);
  if (accountsDue.length > 0) {
    const fifteenDays = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    const dueSoon = accountsDue.filter(e => new Date(e.dueDate!) <= fifteenDays).length;
    if (dueSoon > 0) indicators.push(`${dueSoon} facturas por pagar en los próximos 15 días.`);
  }

  if (indicators.length > 0) {
    if (nextY > 240) { doc.addPage(); nextY = 20; }
    doc.setFontSize(12);
    doc.text('Indicadores del periodo', 14, nextY);
    nextY += 6;
    doc.setFontSize(9);
    doc.setTextColor(80);
    indicators.forEach(ind => {
      doc.text(`• ${ind}`, 16, nextY);
      nextY += 5;
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('Indicador operativo basado en datos registrados en Mitron. No sustituye un estado financiero contable.', 14, 285);

  doc.save(`Resumen_Ejecutivo_Mitron_${periodLabel.replace(/\s/g, '_')}.pdf`);
};

export const generateDetailedExcel = (
  params: ReportParams,
  incomes: SalesReport[],
  expenses: PurchaseDocument[],
  products: Product[],
  movements: InventoryMovement[],
  suppliers: Supplier[],
  brands: Brand[],
  supplyRecords: SupplyRecord[],
  productRequests: ProductRequest[],
  clients: Client[],
  quotes: Quote[],
  crmTasks: CRMTask[],
): void => {
  const wb = XLSX.utils.book_new();
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const periodLabel = params.periodType === 'year' ? `${params.year}` : `${monthNames[params.month]} ${params.year}`;

  const financials = params.periodType === 'year'
    ? computeYearFinancials(incomes, expenses, params.year)
    : computePeriodFinancials(incomes, expenses, params.year, params.month);

  // Resumen
  const summaryData = [
    ['Sistema Mitron - Reporte Detallado'],
    ['Periodo:', periodLabel],
    ['Generado:', formatDateHuman(new Date().toISOString())],
    [],
    ['INDICADOR', 'VALOR'],
    ['Ingresos', financials.totalIncome],
    ['Compras', financials.totalPurchases],
    ['Gastos operativos', financials.totalOperatingExpenses],
    ['Resultado estimado', financials.estimatedResult],
    ['Utilidad reportada', financials.reportedProfit],
    ['Valor inventario conocido', getKnownInventoryValue(products, movements)],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Resumen');

  // Ventas
  const salesRows: (string | number)[][] = [['Documento', 'Periodo', 'SKU', 'Producto', 'Cantidad', 'Total', 'Utilidad']];
  incomes.forEach(inc => {
    inc.lines.forEach(line => {
      salesRows.push([inc.txtFileRef || '', `${inc.periodStart} - ${inc.periodEnd}`, line.sku, line.description, line.quantity, line.total, line.profit]);
    });
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(salesRows), 'Ventas');

  // Compras
  const purchaseRows: (string | number)[][] = [['Fecha', 'Proveedor', 'RFC', 'Factura', 'UUID', 'SKU', 'Concepto', 'Cantidad', 'Costo', 'Total']];
  expenses.forEach(exp => {
    exp.lines.forEach(line => {
      if (!line.stockable) return;
      purchaseRows.push([formatDateHuman(exp.date), exp.supplierName, exp.supplierRfc, `${exp.serie || ''}${exp.folio || ''}`, exp.uuid || '', line.sku, line.description, line.quantity, line.unitCost, line.amount]);
    });
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(purchaseRows), 'Compras');

  // Gastos
  const expenseRows: (string | number)[][] = [['Documento', 'Proveedor', 'Concepto', 'Clasificación', 'Importe']];
  expenses.forEach(exp => {
    exp.lines.forEach(line => {
      if (line.stockable) return;
      expenseRows.push([`${exp.serie || ''}${exp.folio || ''}`, exp.supplierName, line.description, line.costType || 'N/A', line.amount]);
    });
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expenseRows), 'Gastos');

  // Inventario
  const invRows: (string | number)[][] = [['SKU', 'Producto', 'Categoría', 'Subcategoría', 'Marca', 'Existencia', 'Costo', 'Precio', 'Valor conocido', 'Estado']];
  products.forEach(p => {
    const raw = getRawStock(p.id, movements);
    const stock = Math.max(0, raw);
    const status = getInventoryStatus(raw, p.hasPurchaseHistory);
    const value = p.purchaseCost ? stock * p.purchaseCost : 0;
    invRows.push([p.sku, p.description, getCategoryName(p.categoryId), getSubcategoryName(p.subcategoryId), getBrandName(p.brandId, brands), stock, p.purchaseCost || 0, p.salePrice || 0, value, status]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(invRows), 'Inventario');

  // Productos
  const prodRows: (string | number)[][] = [['SKU', 'Descripción', 'Unidad', 'Categoría', 'Subcategoría', 'Marca', 'Costo', 'Precio', 'Fuente precio']];
  products.forEach(p => {
    prodRows.push([p.sku, p.description, p.unit, getCategoryName(p.categoryId), getSubcategoryName(p.subcategoryId), getBrandName(p.brandId, brands), p.purchaseCost || 0, p.salePrice || 0, p.salePriceSource]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodRows), 'Productos');

  // Proveedores
  const supRows: (string | number)[][] = [['Proveedor', 'RFC', 'Facturas', 'Total comprado', 'Contacto', 'Teléfono', 'Correo']];
  suppliers.forEach(s => {
    const supExp = expenses.filter(e => e.supplierRfc === s.rfc);
    supRows.push([s.name, s.rfc, supExp.length, supExp.reduce((sum, e) => sum + e.total, 0), s.contactName || '', s.phone || '', s.email || '']);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(supRows), 'Proveedores');

  // Cuentas por pagar
  const apRows: (string | number)[][] = [['Proveedor', 'Factura', 'Fecha', 'Vencimiento', 'Total', 'Pagado', 'Pendiente', 'Estado']];
  expenses.forEach(e => {
    const paid = e.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
    const remaining = e.total - paid;
    let status = 'PENDIENTE';
    if (remaining <= 0) status = 'PAGADA';
    else if (e.dueDate && new Date(e.dueDate) < new Date()) status = 'VENCIDA';
    else if (paid > 0) status = 'PARCIAL';

    apRows.push([e.supplierName, `${e.serie || ''}${e.folio || ''}`, formatDateHuman(e.date), e.dueDate ? formatDateHuman(e.dueDate) : 'Sin vencimiento', e.total, paid, remaining, status]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(apRows), 'Cuentas por pagar');

  // Abastecimiento
  const splyRows: (string | number)[][] = [['Producto', 'Estado', 'Solicitado', 'Pedido', 'Recibido', 'Fecha esperada', 'Notas']];
  supplyRecords.forEach(r => {
    const prod = products.find(p => p.id === r.productId);
    splyRows.push([prod?.description || r.productId, r.status, r.quantityRequested, r.quantityOrdered, r.quantityReceived, r.expectedDate ? formatDateHuman(r.expectedDate) : '', r.notes || '']);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(splyRows), 'Abastecimiento');

  // Solicitudes
  const reqRows: (string | number)[][] = [['Descripción', 'Marca/Modelo', 'Cantidad', 'Cliente', 'Estado', 'Fecha']];
  productRequests.forEach(r => {
    reqRows.push([r.description, r.brandModel || '', r.quantityRequested, r.clientId || '', r.status, formatDateHuman(r.date)]);
  });
  if (reqRows.length > 1) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(reqRows), 'Solicitudes');
  }

  // Clientes
  const cliRows: (string | number)[][] = [['Nombre', 'Tipo', 'RFC', 'Teléfono', 'Correo', 'Estado']];
  clients.forEach(c => {
    cliRows.push([c.name, c.type || '', c.rfc || '', c.phone || '', c.email || '', c.status || '']);
  });
  if (cliRows.length > 1) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cliRows), 'Clientes');
  }

  // Cotizaciones
  const quoteRows: (string | number)[][] = [['Cliente', 'Fecha', 'Vigencia', 'Subtotal', 'IVA', 'Total', 'Notas']];
  quotes.forEach(q => {
    const client = clients.find(c => c.id === q.clientId);
    quoteRows.push([client?.name || q.clientId, formatDateHuman(q.date), q.validUntil ? formatDateHuman(q.validUntil) : '', q.subtotal, q.iva, q.total, q.notes || '']);
  });
  if (quoteRows.length > 1) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(quoteRows), 'Cotizaciones');
  }

  // Seguimientos
  const taskRows: (string | number)[][] = [['Título', 'Motivo', 'Relacionado a', 'Fecha Vencimiento', 'Estado', 'Cliente']];
  crmTasks.forEach(t => {
    const client = clients.find(c => c.id === t.clientId);
    taskRows.push([t.title, t.reason || '', t.relatedTo, t.dueDate ? formatDateHuman(t.dueDate) : '', t.status, client?.name || '']);
  });
  if (taskRows.length > 1) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(taskRows), 'Seguimientos');
  }

  XLSX.writeFile(wb, `Reporte_Mitron_${periodLabel.replace(/\s/g, '_')}.xlsx`);
};
