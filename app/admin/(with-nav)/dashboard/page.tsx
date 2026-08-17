'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WaiverSearchResult } from '@/lib/types';
import { Search, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import { Button } from '@coyote-force/ui';
import { highlightMatch } from '@/lib/typeahead-utils';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { TableSkeleton } from '@/components/admin/TableSkeleton';

interface TypeaheadOption {
  id: number;
  primary: string;
  secondary?: string;
  minorNames?: string;
  hasMatchingMinors?: boolean;
  data: WaiverSearchResult;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [allWaivers, setAllWaivers] = useState<WaiverSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<WaiverSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [typeaheadSuggestions, setTypeaheadSuggestions] = useState<TypeaheadOption[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const preventBlurRef = useRef(false);

  const loadAllWaivers = useCallback(async () => {
    setIsLoadingAll(true);
    setError('');

    try {
      const response = await fetch('/api/admin/waivers');
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load waivers');
      }

      const data = await response.json();
      setAllWaivers(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingAll(false);
    }
  }, [router]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check');
        if (response.status === 401 || !response.ok) {
          router.push('/admin/login');
        } else {
          setIsAuthenticated(true);
          loadAllWaivers();
        }
      } catch {
        router.push('/admin/login');
      }
    };
    checkAuth();
  }, [router, loadAllWaivers]);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setError('Search query must be at least 2 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    setIsSearchMode(true);

    try {
      const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query.trim())}`);
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchMode(false);
    setError('');
  };

  // Fetch suggestions with debouncing and caching
  useEffect(() => {
    if (searchQuery.trim().length >= 2 && !isSearchMode) {
      const controller = new AbortController();
      let mounted = true;

      setIsLoadingSuggestions(true);
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(
            `/api/admin/search/suggestions?q=${encodeURIComponent(searchQuery.trim())}`,
            { signal: controller.signal }
          );

          if (response.status === 401) {
            router.push('/admin/login');
            return;
          }

          if (!response.ok) {
            if (mounted) {
              setIsLoadingSuggestions(false);
              setTypeaheadSuggestions([]);
            }
            return;
          }

          const data = await response.json();
          const results: WaiverSearchResult[] = data.suggestions || [];

          if (mounted) {
            const queryLower = searchQuery.trim().toLowerCase();
            const formatted: TypeaheadOption[] = results.map((result) => {
              const hasMatchingMinors = result.minorNames && 
                result.minorNames.toLowerCase().includes(queryLower);
              
              return {
                id: result.id,
                primary: `${result.firstName} ${result.lastName}`,
                secondary: result.yearOfBirth ? `Born ${result.yearOfBirth}` : undefined,
                minorNames: result.minorNames || undefined,
                hasMatchingMinors: hasMatchingMinors || false,
                data: result,
              };
            });
            setTypeaheadSuggestions(formatted);
            setIsLoadingSuggestions(false);
          }
        } catch (error: any) {
          if (error.name !== 'AbortError' && mounted) {
            setTypeaheadSuggestions([]);
            setIsLoadingSuggestions(false);
          }
        }
      }, 200);

      return () => {
        mounted = false;
        clearTimeout(timer);
        controller.abort();
        setIsLoadingSuggestions(false);
      };
    } else {
      setTypeaheadSuggestions([]);
      setIsLoadingSuggestions(false);
      setActiveIndex(-1);
    }
  }, [searchQuery, isSearchMode, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <AdminPageShell
      title="Admin Dashboard"
      actions={
        <>
          <Button variant="secondary" size="sm" asChild>
            <a
              href="/api/admin/waivers/export-emails"
              title={`Distinct emails for waiver year ${currentYear} (for Kit / ConvertKit import)`}
            >
              <Download size={14} className="shrink-0" aria-hidden />
              Export {currentYear}
            </a>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <a
              href="/api/admin/waivers/export-emails?all=1"
              title="Distinct emails across all waiver years"
            >
              <Download size={14} className="shrink-0" aria-hidden />
              Export all years
            </a>
          </Button>
        </>
      }
    >
        <div className="rounded border border-border bg-card p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search 
                size={20} 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10" 
              />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={typeaheadSuggestions.length > 0 && searchQuery.trim().length >= 2}
                aria-controls="suggestions-list"
                aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
                aria-autocomplete="list"
                className="flex h-8 w-full rounded border border-input bg-transparent px-2.5 py-1 text-sm pl-12"
                placeholder="Search by player name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchMode(false);
                }}
                onKeyDown={(e) => {
                  if (typeaheadSuggestions.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActiveIndex((prev) => 
                        prev < typeaheadSuggestions.length - 1 ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
                    } else if (e.key === 'Enter' && activeIndex >= 0) {
                      e.preventDefault();
                      const selected = typeaheadSuggestions[activeIndex];
                      const selectedQuery = `${selected.data.firstName} ${selected.data.lastName}`;
                      setSearchQuery(selectedQuery);
                      setTypeaheadSuggestions([]);
                      setActiveIndex(-1);
                      performSearch(selectedQuery);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setTypeaheadSuggestions([]);
                      setActiveIndex(-1);
                    } else if (e.key === 'Tab' && activeIndex >= 0) {
                      e.preventDefault();
                      const selected = typeaheadSuggestions[activeIndex];
                      const selectedQuery = `${selected.data.firstName} ${selected.data.lastName}`;
                      setSearchQuery(selectedQuery);
                      setTypeaheadSuggestions([]);
                      setActiveIndex(-1);
                      performSearch(selectedQuery);
                    }
                  }
                }}
                onBlur={() => {
                  if (!preventBlurRef.current) {
                    setTimeout(() => {
                      setTypeaheadSuggestions([]);
                      setActiveIndex(-1);
                    }, 200);
                  }
                }}
              />
              {isLoadingSuggestions && searchQuery.trim().length >= 2 && (
                <Loader2 
                  size={16} 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground animate-spin" 
                />
              )}
              {typeaheadSuggestions.length > 0 && searchQuery.trim().length >= 2 && !isSearchMode && (
                <div
                  ref={suggestionsRef}
                  id="suggestions-list"
                  role="listbox"
                  className="absolute z-50 w-full mt-1 bg-card border border-input rounded shadow-lg max-h-64 overflow-auto"
                >
                  {typeaheadSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      id={`suggestion-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        index === activeIndex
                          ? 'bg-primary/10 border-l-4 border-brand'
                          : 'hover:bg-muted'
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        preventBlurRef.current = true;
                        const selectedQuery = `${suggestion.data.firstName} ${suggestion.data.lastName}`;
                        setSearchQuery(selectedQuery);
                        setTypeaheadSuggestions([]);
                        setActiveIndex(-1);
                        performSearch(selectedQuery);
                        setTimeout(() => {
                          preventBlurRef.current = false;
                        }, 100);
                      }}
                    >
                      <div
                        className="font-medium text-foreground"
                        dangerouslySetInnerHTML={{
                          __html: highlightMatch(suggestion.primary, searchQuery.trim()),
                        }}
                      />
                      {suggestion.secondary && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {suggestion.secondary}
                        </div>
                      )}
                      {suggestion.hasMatchingMinors && suggestion.minorNames && (
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="font-semibold">Minors: </span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightMatch(suggestion.minorNames, searchQuery.trim()),
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {typeaheadSuggestions.length === 0 && 
               searchQuery.trim().length >= 2 && 
               !isLoadingSuggestions && 
               !isSearchMode && (
                <div
                  role="listbox"
                  className="absolute z-50 w-full mt-1 bg-card border border-input rounded shadow-lg px-4 py-3 text-muted-foreground text-center"
                >
                  No results found
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
              {isSearchMode && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearSearch}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded border border-destructive/30">
              {error}
            </div>
          )}
        </div>

        {isSearchMode && isLoading && (
          <div className="rounded border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Search Results</h2>
            <TableSkeleton columns={7} rows={8} ariaLabel="Loading search results" />
          </div>
        )}

        {isSearchMode && !isLoading && searchResults.length > 0 && (
          <div className="rounded border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Search Results ({searchResults.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="px-4 py-3 text-left text-foreground font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">Email</th>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">Year of Birth</th>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">Minors</th>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">Waiver Year</th>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">Signed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((result) => (
                    <tr key={result.id} className="border-b border-border hover:bg-muted transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <Link 
                          href={`/admin/waivers/${result.id}`}
                          className="text-link underline underline-offset-4 hover:text-link-hover cursor-pointer"
                        >
                          {result.firstName} {result.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {result.email}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {result.yearOfBirth}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {result.minorNames ? (
                          <span className="text-sm">{result.minorNames}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {result.waiverYear}
                      </td>
                      <td className="px-4 py-3">
                        {result.hasCurrentYearWaiver ? (
                          <span className="inline-flex items-center gap-1 text-status-green font-semibold">
                            <CheckCircle size={16} />
                            Valid {currentYear}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive font-semibold">
                            <XCircle size={16} />
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {result.signatureDate ? (() => {
                          try {
                            const date = new Date(result.signatureDate);
                            if (isNaN(date.getTime())) {
                              return 'Invalid Date';
                            }
                            return date.toLocaleDateString();
                          } catch {
                            return 'Invalid Date';
                          }
                        })() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isSearchMode && searchQuery && searchResults.length === 0 && !isLoading && (
          <div className="rounded border border-border bg-card p-6">
            <p className="text-center text-muted-foreground">
              No waivers found for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {!isSearchMode && (
          <div className="rounded border border-border bg-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                All Waiver Submissions ({allWaivers.length})
              </h2>
            </div>
            {isLoadingAll ? (
              <TableSkeleton columns={7} rows={10} ariaLabel="Loading waivers" />
            ) : allWaivers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No waivers submitted yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="px-4 py-3 text-left text-foreground font-semibold">Name</th>
                      <th className="px-4 py-3 text-left text-foreground font-semibold">Email</th>
                      <th className="px-4 py-3 text-left text-foreground font-semibold">Year of Birth</th>
                      <th className="px-4 py-3 text-left text-foreground font-semibold">Minors</th>
                      <th className="px-4 py-3 text-left text-foreground font-semibold">Waiver Year</th>
                      <th className="px-4 py-3 text-left text-foreground font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-foreground font-semibold">Signed Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allWaivers.map((result) => (
                      <tr key={result.id} className="border-b border-border hover:bg-muted transition-colors">
                        <td className="px-4 py-3 font-medium">
                          <Link 
                            href={`/admin/waivers/${result.id}`}
                            className="text-link underline underline-offset-4 hover:text-link-hover cursor-pointer"
                          >
                            {result.firstName} {result.lastName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {result.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {result.yearOfBirth}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {result.minorNames ? (
                            <span className="text-sm">{result.minorNames}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {result.waiverYear}
                        </td>
                        <td className="px-4 py-3">
                          {result.hasCurrentYearWaiver ? (
                            <span className="inline-flex items-center gap-1 text-status-green font-semibold">
                              <CheckCircle size={16} />
                              Valid {currentYear}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive font-semibold">
                              <XCircle size={16} />
                              Expired
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(result.signatureDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
    </AdminPageShell>
  );
}
