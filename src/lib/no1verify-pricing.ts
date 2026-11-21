export const DEFAULT_MARKUP_PERCENT = 30;

export type PricingSettings = {
  markupPercent: number;
  overrides: Record<string, number>;
};

export function normalizeSettings(raw: any): PricingSettings {
  const pct = Number(raw?.markupPercent);
  const overrides: Record<string, number> = {};
  for (const [id, value] of Object.entries(raw?.overrides || {})) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) overrides[String(id)] = n;
  }
  return {
    markupPercent: Number.isFinite(pct) && pct >= 0 ? pct : DEFAULT_MARKUP_PERCENT,
    overrides,
  };
}

// costKobo = No1Verify's Naira price in kobo (market_price_cents).
// Returns the customer's selling price in whole naira (0 = not for sale).
export function sellingPriceNaira(
  productId: number | string,
  costKobo: number,
  settings: PricingSettings,
): number {
  const costNaira = Math.ceil(Math.max(Number(costKobo) || 0, 0) / 100);
  const fixed = settings.overrides[String(productId)];
  if (fixed && fixed > 0) return Math.max(Math.ceil(fixed), costNaira);
  return Math.ceil(costNaira * (1 + settings.markupPercent / 100));
}
