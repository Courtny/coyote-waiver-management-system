import { highlightMatch, typeaheadCache } from '../typeahead-utils';

describe('highlightMatch', () => {
  it('should highlight matching text', () => {
    const result = highlightMatch('John Smith', 'John');
    expect(result).toContain('<mark');
    expect(result).toContain('John');
  });

  it('should handle case-insensitive matching', () => {
    const result = highlightMatch('John Smith', 'john');
    expect(result).toContain('<mark');
  });

  it('should return original text if no match', () => {
    const result = highlightMatch('John Smith', 'Jane');
    expect(result).toBe('John Smith');
  });

  it('should handle empty query', () => {
    const result = highlightMatch('John Smith', '');
    expect(result).toBe('John Smith');
  });

  it('should escape special regex characters', () => {
    const result = highlightMatch('Test (value)', '(value)');
    expect(result).toContain('<mark');
  });
});

describe('typeaheadCache', () => {
  beforeEach(() => {
    typeaheadCache.clear();
  });

  it('should store and retrieve values', () => {
    typeaheadCache.set('test', { data: 'value' });
    expect(typeaheadCache.get('test')).toEqual({ data: 'value' });
  });

  it('should return null for non-existent keys', () => {
    expect(typeaheadCache.get('nonexistent')).toBeNull();
  });

  it('should clear cache', () => {
    typeaheadCache.set('test', { data: 'value' });
    typeaheadCache.clear();
    expect(typeaheadCache.get('test')).toBeNull();
  });
});
