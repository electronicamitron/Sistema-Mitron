// Costing profile and price calculation

export interface CostingProfile {
  adqFletesPct: number;
  adqSeguroPct: number;
  adqLogisticaPct: number;
  adqOtrosPct: number;
  opNominaPct: number;
  opRentaPct: number;
  opServiciosPct: number;
  opAdminPct: number;
  comComisionPct: number;
  comFinanciamientoPct: number;
  comOtrosPct: number;
  defaultMarginPct: number;
  defaultVatPct: number;
}

const COSTING_KEY = 'mitron_costing_profile_v1_2'; // bump version so it resets

export const defaultCostingProfile: CostingProfile = {
  adqFletesPct: 0,
  adqSeguroPct: 0,
  adqLogisticaPct: 0,
  adqOtrosPct: 0,
  opNominaPct: 0,
  opRentaPct: 0,
  opServiciosPct: 0,
  opAdminPct: 0,
  comComisionPct: 0,
  comFinanciamientoPct: 0,
  comOtrosPct: 0,
  defaultMarginPct: 30,
  defaultVatPct: 16,
};

export const loadCostingProfile = (): CostingProfile => {
  try {
    const stored = localStorage.getItem(COSTING_KEY);
    if (stored) return { ...defaultCostingProfile, ...JSON.parse(stored) };
  } catch { /* empty */ }
  return { ...defaultCostingProfile };
};

export const saveCostingProfile = (profile: CostingProfile): void => {
  localStorage.setItem(COSTING_KEY, JSON.stringify(profile));
};

export interface PriceCalculation {
  purchaseCost: number;
  directCosts: number;
  adqCosts: number;
  landedCost: number;       // purchaseCost + directCosts
  indirectCosts: number;
  opCosts: number;
  comCosts: number;
  economicCost: number;     // landedCost + indirectCosts
  marginPct: number;        // Margin on sale (not markup)
  priceBeforeVat: number;   // economicCost / (1 - margin)
  profit: number;           // priceBeforeVat - economicCost
  vatPct: number;
  vatAmount: number;
  finalPrice: number;       // priceBeforeVat * (1 + vat)
}

/** Full price calculation with costing profile */
export const calculatePrice = (
  purchaseCost: number,
  profile: CostingProfile,
  marginOverride?: number,
  vatOverride?: number
): PriceCalculation => {
  const margin = marginOverride ?? profile.defaultMarginPct;
  const vat = vatOverride ?? profile.defaultVatPct;

  const adqPct = profile.adqFletesPct + profile.adqSeguroPct + profile.adqLogisticaPct + profile.adqOtrosPct;
  const opPct = profile.opNominaPct + profile.opRentaPct + profile.opServiciosPct + profile.opAdminPct;
  const comPct = profile.comComisionPct + profile.comFinanciamientoPct + profile.comOtrosPct;
  
  const directPct = adqPct;

  const directCosts = purchaseCost * (directPct / 100);
  const adqCosts = directCosts;
  
  const landedCost = purchaseCost + directCosts;
  
  const opCosts = landedCost * (opPct / 100);
  const comCosts = landedCost * (comPct / 100);
  const indirectCosts = opCosts + comCosts;
  
  const economicCost = landedCost + indirectCosts;

  const marginDec = margin / 100;
  const priceBeforeVat = marginDec >= 1 ? economicCost * 100 : economicCost / (1 - marginDec);
  const profit = priceBeforeVat - economicCost;
  const vatAmount = priceBeforeVat * (vat / 100);
  const finalPrice = priceBeforeVat + vatAmount;

  return {
    purchaseCost,
    directCosts,
    adqCosts,
    landedCost,
    indirectCosts,
    opCosts,
    comCosts,
    economicCost,
    marginPct: margin,
    priceBeforeVat,
    profit,
    vatPct: vat,
    vatAmount,
    finalPrice,
  };
};

/** Simple price calculation (without costing profile costs) */
export const calculateSimplePrice = (
  purchaseCost: number,
  margin: number,
  vat: number
): PriceCalculation => {
  const marginDec = margin / 100;
  const priceBeforeVat = marginDec >= 1 ? purchaseCost * 100 : purchaseCost / (1 - marginDec);
  const profit = priceBeforeVat - purchaseCost;
  const vatAmount = priceBeforeVat * (vat / 100);
  const finalPrice = priceBeforeVat + vatAmount;

  return {
    purchaseCost,
    directCosts: 0,
    adqCosts: 0,
    landedCost: purchaseCost,
    indirectCosts: 0,
    opCosts: 0,
    comCosts: 0,
    economicCost: purchaseCost,
    marginPct: margin,
    priceBeforeVat,
    profit,
    vatPct: vat,
    vatAmount,
    finalPrice,
  };
};
