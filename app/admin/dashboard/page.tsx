'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WaiverSearchResult } from '@/lib/types';
import { Search, LogOut, CheckCircle, XCircle } from 'lucide-react';

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
  }, [router]);

  const loadAllWaivers = async () => {
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
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim().length < 2) {
      setError('Search query must be at least 2 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    setIsSearchMode(true);

    try {
      const response = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`);
      
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
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchMode(false);
    setError('');
  };

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
          <button
            onClick={handleLogout}
            className="btn btn-secondary flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <div className="card mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search 
                size={20} 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="text"
                className="input pl-12"
                placeholder="Search by player name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                        {new Date(result.signatureDate).toLocaleDateString()}
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
              No waivers found for "{searchQuery}"
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
