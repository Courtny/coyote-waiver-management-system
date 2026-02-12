import { useState, useEffect, useRef, useCallback } from 'react';
import { WaiverSearchResult } from '@/lib/types';

export interface TypeaheadOption {
  id: number;
  primary: string;
  secondary?: string;
  data: WaiverSearchResult;
}

interface UseTypeaheadOptions {
  minLength?: number;
  debounceMs?: number;
  maxResults?: number;
  onSelect?: (option: TypeaheadOption) => void;
}

export function useTypeahead(
  query: string,
  fetchSuggestions: (q: string, signal: AbortSignal) => Promise<TypeaheadOption[]>,
  options: UseTypeaheadOptions = {}
) {
  const {
    minLength = 2,
    debounceMs = 200,
    onSelect,
  } = options;

  const [suggestions, setSuggestions] = useState<TypeaheadOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWithCache = useCallback(async (q: string, signal: AbortSignal) => {
    try {
      const response = await fetch(`/api/admin/search/suggestions?q=${encodeURIComponent(q)}`, {
        signal,
      });

      if (response.status === 401) {
        return [];
      }

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      const results: WaiverSearchResult[] = data.suggestions || [];

      return results.map((result) => ({
        id: result.id,
        primary: `${result.firstName} ${result.lastName}`,
        secondary: result.yearOfBirth ? `Born ${result.yearOfBirth}` : undefined,
        data: result,
      }));
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return [];
      }
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < minLength) {
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const results = await fetchWithCache(trimmedQuery, controller.signal);
        
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setActiveIndex(-1);
          setIsLoading(false);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setSuggestions([]);
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, minLength, debounceMs, fetchWithCache]);

  const selectOption = useCallback((option: TypeaheadOption | null) => {
    if (option && onSelect) {
      onSelect(option);
    }
    setIsOpen(false);
    setActiveIndex(-1);
  }, [onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim().length >= minLength) {
        // Allow form submission
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          selectOption(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      case 'Tab':
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          e.preventDefault();
          selectOption(suggestions[activeIndex]);
        }
        break;
    }
  }, [isOpen, suggestions, activeIndex, selectOption, query, minLength]);

  return {
    suggestions,
    isLoading,
    isOpen,
    activeIndex,
    handleKeyDown,
    selectOption,
    setIsOpen,
    setActiveIndex,
  };
}
