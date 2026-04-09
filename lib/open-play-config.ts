export type OpenPlaySkuDay = 'saturday' | 'sunday';

export type OpenPlayConfig = {
  productId: string;
  /** SKU string → which day slot (when SKUs are unique per day, or as fallback) */
  skuToDay: Record<string, OpenPlaySkuDay>;
  /** Webflow variant id → day (use when the same SKU is reused for Sat/Sun rows) */
  variantToDay: Record<string, OpenPlaySkuDay>;
};

function parseDayMapJson(raw: string | undefined): Record<string, OpenPlaySkuDay> {
  if (!raw?.trim()) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, OpenPlaySkuDay> = {};
    for (const [key, v] of Object.entries(obj)) {
      const k = key.trim();
      if (!k) continue;
      const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
      if (s === 'saturday' || s === 'sunday') out[k] = s;
    }
    return out;
  } catch {
    return {};
  }
}

export function getOpenPlayConfig(): OpenPlayConfig {
  const productId = (process.env.OPEN_PLAY_PRODUCT_ID || '').trim();
  const skuToDay = parseDayMapJson(process.env.OPEN_PLAY_SKU_DAYS_JSON);
  const variantToDay = parseDayMapJson(process.env.OPEN_PLAY_VARIANT_DAYS_JSON);
  return { productId, skuToDay, variantToDay };
}

export function isOpenPlayConfigured(): boolean {
  const { productId, skuToDay, variantToDay } = getOpenPlayConfig();
  const hasDayMap =
    Object.keys(skuToDay).length > 0 || Object.keys(variantToDay).length > 0;
  return Boolean(productId && hasDayMap);
}
