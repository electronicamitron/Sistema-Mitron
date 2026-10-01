import type { PurchaseDocument, PurchaseLine } from '../types/purchase';
import type { SalesReport, SalesLine } from '../types/sales';

export const isStockableConcept = (unitCode: string, unitName: string): boolean => {
  if (unitCode.toUpperCase() === 'E48') return false;
  if (unitName.toLowerCase().trim() === 'servicio') return false;
  return true;
};

export const parseCfdi = (xml: string, xmlFileName: string, pdfFileName?: string): PurchaseDocument => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  const comprobante = doc.getElementsByTagName('cfdi:Comprobante')[0];
  if (!comprobante) throw new Error('No es un CFDI válido');
  
  // const version = comprobante.getAttribute('Version') || '4.0';
  const serie = comprobante.getAttribute('Serie') || '';
  const folio = comprobante.getAttribute('Folio') || '';
  const date = comprobante.getAttribute('Fecha') || new Date().toISOString();
  const subtotal = parseFloat(comprobante.getAttribute('SubTotal') || '0');
  const total = parseFloat(comprobante.getAttribute('Total') || '0');
  const currency = comprobante.getAttribute('Moneda') || 'MXN';
  
  const emisor = doc.getElementsByTagName('cfdi:Emisor')[0];
  const supplierRfc = emisor?.getAttribute('Rfc') || 'SIN RFC';
  const supplierName = emisor?.getAttribute('Nombre') || 'SIN NOMBRE';
  
  const timbre = doc.getElementsByTagName('tfd:TimbreFiscalDigital')[0];
  const uuid = timbre?.getAttribute('UUID') || '';
  
  let iva = 0;
  const impuestosNodes = doc.getElementsByTagName('cfdi:Impuestos');
  for (let i = 0; i < impuestosNodes.length; i++) {
    if (impuestosNodes[i].hasAttribute('TotalImpuestosTrasladados')) {
      iva = parseFloat(impuestosNodes[i].getAttribute('TotalImpuestosTrasladados') || '0');
      break;
    }
  }

  const conceptNodes = doc.getElementsByTagName('cfdi:Concepto');
  const lines: PurchaseLine[] = [];
  
  for (let i = 0; i < conceptNodes.length; i++) {
    const node = conceptNodes[i];
    const sku = node.getAttribute('NoIdentificacion') || '';
    const description = node.getAttribute('Descripcion') || '';
    const quantity = parseFloat(node.getAttribute('Cantidad') || '0');
    const unit = node.getAttribute('Unidad') || '';
    const unitCode = node.getAttribute('ClaveUnidad') || '';
    const unitCost = parseFloat(node.getAttribute('ValorUnitario') || '0');
    const amount = parseFloat(node.getAttribute('Importe') || '0');
    
    lines.push({
      id: Math.random().toString(36).substring(2, 9),
      documentId: uuid || `${serie}${folio}`,
      sku: sku.trim(),
      description: description.trim(),
      quantity,
      unit: unit.trim(),
      unitCode: unitCode.trim(),
      unitCost,
      amount,
      stockable: isStockableConcept(unitCode, unit)
    });
  }

  return {
    id: uuid || `${supplierRfc}-${serie}-${folio}`,
    uuid,
    serie,
    folio,
    date,
    supplierRfc,
    supplierName,
    subtotal,
    iva,
    total,
    currency,
    lines,
    xmlFileRef: xmlFileName,
    pdfFileRef: pdfFileName,
    importedAt: new Date().toISOString()
  };
};

export const parseSalesReport = (txt: string, txtFileName: string, pdfFileName?: string): SalesReport => {
  const lines = txt.split('\n');
  let periodStart = '';
  let periodEnd = '';
  const parsedLines: SalesLine[] = [];
  let total = 0;
  
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // VERY naive period extraction: assuming it says "Periodo: Julio 2026" or similar
    if (line.toLowerCase().includes('periodo')) {
      periodStart = line; // just store the raw string for now
      periodEnd = line;
    }
    
    // Look for headers
    if (line.includes('CLAVE') && line.includes('ARTICULO') && line.includes('CANTIDAD')) {
      inTable = true;
      continue;
    }
    
    if (inTable) {
      // Ignore totals row
      if (line.toUpperCase().includes('TOTAL GENERAL') || line.toUpperCase().startsWith('TOTAL')) {
        const parts = line.split('\t').map(s => s.trim()).filter(Boolean);
        // The last part is usually the total
        total = parseFloat(parts[parts.length - 1].replace(/,/g, ''));
        break;
      }
      
      const parts = line.split('\t').map(s => s.trim());
      // Expecting: CLAVE, ARTICULO, UNIDAD, CANTIDAD, PRECIO U., COSTO U., IMPORTE, COSTO, UTILIDAD, UTIL.UNIT., % UTILIDAD, TOTAL
      if (parts.length >= 10) {
        const sku = parts[0];
        const description = parts[1];
        const unit = parts[2];
        const quantity = parseFloat(parts[3].replace(/,/g, ''));
        const unitPrice = parseFloat(parts[4].replace(/,/g, ''));
        const unitCost = parseFloat(parts[5].replace(/,/g, ''));
        const amount = parseFloat(parts[6].replace(/,/g, ''));
        const cost = parseFloat(parts[7].replace(/,/g, ''));
        const profit = parseFloat(parts[8].replace(/,/g, ''));
        const lineTotal = parseFloat(parts[11] ? parts[11].replace(/,/g, '') : parts[parts.length - 1].replace(/,/g, ''));
        
        parsedLines.push({
          id: Math.random().toString(36).substring(2, 9),
          reportId: '', // set later
          sku,
          description,
          unit,
          quantity,
          unitPrice,
          unitCost,
          amount,
          cost,
          profit,
          total: lineTotal
        });
      }
    }
  }
  
  if (total === 0 && parsedLines.length > 0) {
    total = parsedLines.reduce((sum, line) => sum + line.total, 0);
  }

  const reportId = Date.now().toString() + Math.random().toString(36).substring(2, 6);
  parsedLines.forEach(l => l.reportId = reportId);

  return {
    id: reportId,
    periodStart: periodStart || 'Periodo no identificado',
    periodEnd: periodEnd || 'Periodo no identificado',
    generatedAt: new Date().toISOString(),
    total,
    lines: parsedLines,
    txtFileRef: txtFileName,
    pdfFileRef: pdfFileName,
    importedAt: new Date().toISOString()
  };
};
