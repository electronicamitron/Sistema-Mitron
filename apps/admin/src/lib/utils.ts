export const getLocalYYYYMMDD = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  // Extraer siempre la parte de la fecha (YYYY-MM-DD) para evitar desfases de zona horaria
  const datePart = dateStr.split('T')[0];
  const parts = datePart.split('-');
  
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr);
};

export const formatLocalDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const day = d.getDate().toString().padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  return `${day} ${month} ${year}`;
};

export const formatDateHuman = (dateStr: string | null | undefined, includeTime = false) => {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const day = d.getDate().toString().padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  if (includeTime && dateStr.includes('T')) {
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} · ${hours}:${minutes}`;
  }
  
  return `${day} ${month} ${year}`;
};

export const formatPeriod = (start: string | null | undefined, end: string | null | undefined): string => {
  if (!start && !end) return '';
  if (start && !end) return formatLocalDate(start);
  if (!start && end) return formatLocalDate(end);
  
  const ds = parseLocalDate(start!);
  const de = parseLocalDate(end!);
  
  if (ds.getMonth() === de.getMonth() && ds.getFullYear() === de.getFullYear()) {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const d1 = ds.getDate().toString().padStart(2, '0');
    const d2 = de.getDate().toString().padStart(2, '0');
    return `${d1}–${d2} ${months[ds.getMonth()]} ${ds.getFullYear()}`;
  }
  
  return `${formatLocalDate(start)} - ${formatLocalDate(end)}`;
};
