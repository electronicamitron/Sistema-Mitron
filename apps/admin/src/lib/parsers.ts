import type { PurchaseDocument, PurchaseLine, PurchaseLineTax } from '../types/purchase';
import type { SalesReport, SalesLine } from '../types/sales';

export const isStockableConcept = (unitCode: string, unitName: string, description: string = ''): boolean => {
  if (unitCode.toUpperCase() === 'E48') return false;
  if (unitName.toLowerCase().trim() === 'servicio') return false;
  if (description.toUpperCase().includes('SEGURO DE TRANSPORTE')) return false;
  return true;
};

export const parseCfdi = (xml: string, xmlFileName: string, pdfFileName?: string): PurchaseDocument => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  const comprobante = doc.getElementsByTagName('cfdi:Comprobante')[0];
  if (!comprobante) throw new Error('No es un CFDI válido');

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

    // Parse line-level taxes
    const taxes: PurchaseLineTax[] = [];
    const trasladosNode = node.getElementsByTagName('cfdi:Traslado');
    for (let t = 0; t < trasladosNode.length; t++) {
      taxes.push({
        tax: trasladosNode[t].getAttribute('Impuesto') || 'IVA',
        type: 'traslado',
        rate: parseFloat(trasladosNode[t].getAttribute('TasaOCuota') || '0'),
        amount: parseFloat(trasladosNode[t].getAttribute('Importe') || '0'),
      });
    }
    const retencionesNode = node.getElementsByTagName('cfdi:Retencion');
    for (let t = 0; t < retencionesNode.length; t++) {
      taxes.push({
        tax: retencionesNode[t].getAttribute('Impuesto') || '',
        type: 'retencion',
        rate: parseFloat(retencionesNode[t].getAttribute('TasaOCuota') || '0'),
        amount: parseFloat(retencionesNode[t].getAttribute('Importe') || '0'),
      });
    }

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
      stockable: isStockableConcept(unitCode, unit, description),
      taxes: taxes.length > 0 ? taxes : undefined,
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
    importedAt: new Date().toISOString(),
    rawXml: xml,
  };
};

export const parseSalesReport = (txt: string, txtFileName: string, pdfFileName?: string): SalesReport => {
  const lines = txt.split('\n');
  let periodStart = '';
  let periodEnd = '';
  const parsedLines: SalesLine[] = [];
  let total = 0;

  // Try to extract date range from header
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i].trim();

    // Look for date patterns like "01/07/2026" or "Periodo: ..."
    if (line.toLowerCase().includes('periodo')) {
      const monthShortMap: Record<string, string> = {
        'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
        'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
      };
      
      const slashPattern = /(\d{2})\/(\d{2})\/(\d{4})/g;
      const dashPattern = /(\d{2})-([A-Za-z]{3})-(\d{4})/g;
      
      let matches = [...line.matchAll(dashPattern)];
      if (matches.length >= 2) {
        const m1 = monthShortMap[matches[0][2].toLowerCase()] || '01';
        const m2 = monthShortMap[matches[1][2].toLowerCase()] || '01';
        periodStart = `${matches[0][3]}-${m1}-${matches[0][1]}`;
        periodEnd = `${matches[1][3]}-${m2}-${matches[1][1]}`;
      } else if (matches.length === 1) {
        const m1 = monthShortMap[matches[0][2].toLowerCase()] || '01';
        periodStart = `${matches[0][3]}-${m1}-${matches[0][1]}`;
        periodEnd = periodStart;
      } else {
        matches = [...line.matchAll(slashPattern)];
        if (matches.length >= 2) {
          periodStart = `${matches[0][3]}-${matches[0][2]}-${matches[0][1]}`;
          periodEnd = `${matches[1][3]}-${matches[1][2]}-${matches[1][1]}`;
        } else if (matches.length === 1) {
          periodStart = `${matches[0][3]}-${matches[0][2]}-${matches[0][1]}`;
          periodEnd = periodStart;
        } else {
          // Keep as text if it couldn't be parsed
          periodStart = line.replace(/periodo:?\s*(del)?\s*/i, '').trim();
          periodEnd = periodStart;
        }
      }
    }

    // Check for month/year patterns in title like "Julio Ventas"
    if (!periodStart && i < 5) {
      const monthMap: Record<string, string> = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
      };
      for (const [monthName, monthNum] of Object.entries(monthMap)) {
        if (line.toLowerCase().includes(monthName)) {
          const yearMatch = line.match(/\b(20\d{2})\b/);
          if (yearMatch) {
            const year = yearMatch[1];
            const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
            periodStart = `${year}-${monthNum}-01`;
            periodEnd = `${year}-${monthNum}-${daysInMonth.toString().padStart(2, '0')}`;
          }
        }
      }
    }
  }

  // Infer from filename if still no period
  if (!periodStart) {
    const monthMap: Record<string, string> = {
      'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
      'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
      'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
    };
    const lowerName = txtFileName.toLowerCase();
    for (const [monthName, monthNum] of Object.entries(monthMap)) {
      if (lowerName.includes(monthName)) {
        // Try to find year in filename or use current year
        const yearMatch = txtFileName.match(/\b(20\d{2})\b/);
        const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
        const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
        periodStart = `${year}-${monthNum}-01`;
        periodEnd = `${year}-${monthNum}-${daysInMonth.toString().padStart(2, '0')}`;
        break;
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Look for headers
    if (line.includes('CLAVE') && line.includes('ARTICULO') && line.includes('CANTIDAD')) {
      continue;
    }

      const parts = line.split('\t').map(s => s.trim());

      // Check if it's the totals row (empty first columns)
      if ((line.toUpperCase().includes('TOTAL GENERAL') || line.toUpperCase().startsWith('TOTAL')) || (!parts[0] && !parts[1] && parts.length > 5)) {
        const numericParts = parts.filter(Boolean);
        if (numericParts.length > 0) {
          total = parseFloat(numericParts[numericParts.length - 1].replace(/,/g, ''));
        }
        break; // Totals are usually at the end
      }

      // Expecting: CLAVE, ARTICULO, UNIDAD, CANTIDAD, PRECIO U., COSTO U., IMPORTE, COSTO, UTILIDAD, UTIL.UNIT., % UTILIDAD, TOTAL
      if (parts.length >= 10 && parts[0]) {
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
