export type CheckinEventOption = {
  id: string;
  label: string;
  /** If set, Tickets detail SKU filter defaults to only these keys (intersected with lines); omit for all SKUs. */
  defaultIncludedSkuKeys?: string[];
};

function parseJsonMap(raw: string | undefined): Record<string, number> {
  if (!raw?.trim()) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(obj)) {
      const n = typeof v === 'number' ? v : Number(v);
      if (Number.isFinite(n) && n >= 1) out[k] = Math.floor(n);
    }
    return out;
  } catch {
    return {};
  }
}

function parseJsonStringMap(raw: string | undefined): Record<string, string> {
  if (!raw?.trim()) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && v.trim()) out[k] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

function parseEventsJson(raw: string | undefined): CheckinEventOption[] {
  if (!raw?.trim()) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const o = item as Record<string, unknown>;
        const id = typeof o.id === 'string' ? o.id : '';
        const label = typeof o.label === 'string' ? o.label : id;
        if (!id) return null;
        let defaultIncludedSkuKeys: string[] | undefined;
        const rawKeys = o.defaultIncludedSkuKeys;
        if (Array.isArray(rawKeys)) {
          const keys = rawKeys
            .filter((x): x is string => typeof x === 'string')
            .map((s) => s.trim())
            .filter(Boolean);
          if (keys.length > 0) defaultIncludedSkuKeys = keys;
        }
        const entry: CheckinEventOption = { id, label };
        if (defaultIncludedSkuKeys) entry.defaultIncludedSkuKeys = defaultIncludedSkuKeys;
        return entry;
      })
      .filter(Boolean) as CheckinEventOption[];
  } catch {
    return [];
  }
}

export function getCheckinConfig() {
  return {
    webflowToken: process.env.WEBFLOW_API_TOKEN || '',
    webflowSiteId: process.env.WEBFLOW_SITE_ID || '',
    skuPartySize: parseJsonMap(process.env.CHECKIN_SKU_PARTY_SIZE),
    skuDisplay: parseJsonStringMap(process.env.CHECKIN_SKU_DISPLAY),
    events: parseEventsJson(process.env.CHECKIN_EVENTS_JSON),
    cacheTtlMs: Math.max(60_000, Number(process.env.CHECKIN_CACHE_TTL_MS) || 7 * 60_000),
  };
}

export function isWebflowConfigured(): boolean {
  const c = getCheckinConfig();
  return Boolean(c.webflowToken && c.webflowSiteId);
}
