'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { highlightMatch } from '@/lib/typeahead-utils';
import { WaiverSearchResult } from '@/lib/types';

interface TypeaheadOption {
  id: number;
  primary: string;
  secondary?: string;
  minorNames?: string;
  hasMatchingMinors?: boolean;
  data: WaiverSearchResult;
}

export interface PlayerNameTypeaheadProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onPick: (waiver: WaiverSearchResult) => void;
  placeholder?: string;
}

export function PlayerNameTypeahead({
  id,
  value,
  onChange,
  onPick,
  placeholder = 'Full name',
}: PlayerNameTypeaheadProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<TypeaheadOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suppressEmptyState, setSuppressEmptyState] = useState(false);
  const preventBlurRef = useRef(false);
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setActiveIndex(-1);
      return;
    }

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      setSuggestions([]);
      setActiveIndex(-1);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/search/suggestions?q=${encodeURIComponent(value.trim())}`,
          { signal: controller.signal }
        );
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const results: WaiverSearchResult[] = data.suggestions || [];
        const queryLower = value.trim().toLowerCase();
        const formatted: TypeaheadOption[] = results.map((result) => {
          const hasMatchingMinors =
            Boolean(result.minorNames && result.minorNames.toLowerCase().includes(queryLower));
          return {
            id: result.id,
            primary: `${result.firstName} ${result.lastName}`,
            secondary: result.yearOfBirth ? `Born ${result.yearOfBirth}` : undefined,
            minorNames: result.minorNames || undefined,
            hasMatchingMinors,
            data: result,
          };
        });
        if (!cancelled) {
          setSuggestions(formatted);
          setActiveIndex(-1);
        }
      } catch (e: unknown) {
        const name = e && typeof e === 'object' && 'name' in e ? (e as { name?: string }).name : '';
        if (name !== 'AbortError' && !cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, router]);

  const pick = useCallback(
    (suggestion: TypeaheadOption) => {
      skipNextFetchRef.current = true;
      setSuppressEmptyState(true);
      setSuggestions([]);
      setActiveIndex(-1);
      onPick(suggestion.data);
    },
    [onPick]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        pick(suggestions[activeIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestions([]);
        setActiveIndex(-1);
      } else if (e.key === 'Tab' && activeIndex >= 0) {
        e.preventDefault();
        pick(suggestions[activeIndex]);
      }
    }
  };

  const q = value.trim();

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={20} />
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="name"
        aria-expanded={suggestions.length > 0 && q.length >= 2}
        aria-controls={`${id}-suggestions`}
        aria-activedescendant={activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
        aria-autocomplete="list"
        className="input pl-12"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          skipNextFetchRef.current = false;
          setSuppressEmptyState(false);
          onChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!preventBlurRef.current) {
            setTimeout(() => {
              setSuggestions([]);
              setActiveIndex(-1);
            }, 200);
          }
        }}
      />
      {isLoading && q.length >= 2 && (
        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={16} />
      )}
      {suggestions.length > 0 && q.length >= 2 && (
        <div
          id={`${id}-suggestions`}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              id={`${id}-opt-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === activeIndex ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                preventBlurRef.current = true;
                pick(suggestion);
                setTimeout(() => {
                  preventBlurRef.current = false;
                }, 100);
              }}
            >
              <div
                className="font-medium text-gray-900"
                dangerouslySetInnerHTML={{
                  __html: highlightMatch(suggestion.primary, q),
                }}
              />
              {suggestion.secondary && (
                <div className="text-sm text-gray-500 mt-1">{suggestion.secondary}</div>
              )}
              {suggestion.hasMatchingMinors && suggestion.minorNames && (
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">Minors: </span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightMatch(suggestion.minorNames, q),
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {suggestions.length === 0 && q.length >= 2 && !isLoading && !suppressEmptyState && (
        <div
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 text-gray-500 text-center"
        >
          No results found
        </div>
      )}
    </div>
  );
}
