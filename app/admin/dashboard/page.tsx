'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WaiverSearchResult } from '@/lib/types';
import { Search, LogOut, CheckCircle, XCircle, Users, Loader2 } from 'lucide-react';
import { highlightMatch } from '@/lib/typeahead-utils';

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

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="btn btn-secondary flex items-center gap-2"
            >
              <Users size={18} />
              Manage Users
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-secondary flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        <div className="card mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search 
                size={20} 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" 
              />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={typeaheadSuggestions.length > 0 && searchQuery.trim().length >= 2}
                aria-controls="suggestions-list"
                aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
                aria-autocomplete="list"
                className="input pl-12"
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
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" 
                />
              )}
              {typeaheadSuggestions.length > 0 && searchQuery.trim().length >= 2 && !isSearchMode && (
                <div
                  ref={suggestionsRef}
                  id="suggestions-list"
                  role="listbox"
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto"
                >
                  {typeaheadSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      id={`suggestion-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        index === activeIndex
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50'
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
                        className="font-medium text-gray-900"
                        dangerouslySetInnerHTML={{
                          __html: highlightMatch(suggestion.primary, searchQuery.trim()),
                        }}
                      />
                      {suggestion.secondary && (
                        <div className="text-sm text-gray-500 mt-1">
                          {suggestion.secondary}
                        </div>
                      )}
                      {suggestion.hasMatchingMinors && suggestion.minorNames && (
                        <div className="text-sm text-gray-600 mt-1">
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
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 text-gray-500 text-center"
                >
                  No results found
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
              {isSearchMode && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="btn btn-secondary"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>

        {isSearchMode && searchResults.length > 0 && (
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Search Results ({searchResults.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Email</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Year of Birth</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Minors</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Waiver Year</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Signed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((result) => (
                    <tr key={result.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <Link 
                          href={`/admin/waivers/${result.id}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          {result.firstName} {result.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {result.email}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {result.yearOfBirth}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {result.minorNames ? (
                          <span className="text-sm">{result.minorNames}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {result.waiverYear}
                      </td>
                      <td className="px-4 py-3">
                        {result.hasCurrentYearWaiver ? (
                          <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                            <CheckCircle size={16} />
                            Valid {currentYear}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                            <XCircle size={16} />
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
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
          <div className="card">
            <p className="text-center text-gray-600">
              No waivers found for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {!isSearchMode && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                All Waiver Submissions ({allWaivers.length})
              </h2>
            </div>
            {isLoadingAll ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading waivers...</p>
              </div>
            ) : allWaivers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No waivers submitted yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-4 py-3 text-left text-gray-700 font-semibold">Name</th>
                      <th className="px-4 py-3 text-left text-gray-700 font-semibold">Email</th>
                      <th className="px-4 py-3 text-left text-gray-700 font-semibold">Year of Birth</th>
                      <th className="px-4 py-3 text-left text-gray-700 font-semibold">Minors</th>
                      <th className="px-4 py-3 text-left text-gray-700 font-semibold">Waiver Year</th>
                      <th className="px-4 py-3 text-left text-gray-700 font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-gray-700 font-semibold">Signed Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allWaivers.map((result) => (
                      <tr key={result.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          <Link 
                            href={`/admin/waivers/${result.id}`}
                            className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                          >
                            {result.firstName} {result.lastName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {result.email}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {result.yearOfBirth}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {result.minorNames ? (
                            <span className="text-sm">{result.minorNames}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {result.waiverYear}
                        </td>
                        <td className="px-4 py-3">
                          {result.hasCurrentYearWaiver ? (
                            <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                              <CheckCircle size={16} />
                              Valid {currentYear}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                              <XCircle size={16} />
                              Expired
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
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
      </div>
    </div>
  );
}
