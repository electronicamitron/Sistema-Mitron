// Brands entity

export interface Brand {
  id: string;
  name: string;
}

// Persisted brands – stored in localStorage
const BRANDS_KEY = 'mitron_brands_v1';

export const loadBrands = (): Brand[] => {
  try {
    const stored = localStorage.getItem(BRANDS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* empty */ }
  return [];
};

export const saveBrands = (brands: Brand[]): void => {
  localStorage.setItem(BRANDS_KEY, JSON.stringify(brands));
};

export const getBrandName = (brandId: string | null | undefined, brands: Brand[]): string => {
  if (!brandId) return '';
  return brands.find(b => b.id === brandId)?.name ?? '';
};
