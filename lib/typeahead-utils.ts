/**
 * Highlights matching substrings in text
 */
export function highlightMatch(text: string, query: string): string {
  if (!query || !text) return text;
  
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);
  
  return parts
    .map((part) => {
      // Create a new regex for each test to avoid lastIndex state issues
      const testRegex = new RegExp(`^${escapedQuery}$`, 'i');
      if (testRegex.test(part)) {
        return `<mark class="bg-yellow-200 font-semibold">${part}</mark>`;
      }
      return part;
    })
    .join('');
}

/**
 * Simple in-memory cache for typeahead results
 */
class TypeaheadCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl: number;

  constructor(ttlMs: number = 120000) {
    this.ttl = ttlMs;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const typeaheadCache = new TypeaheadCache(120000); // 2 minutes
