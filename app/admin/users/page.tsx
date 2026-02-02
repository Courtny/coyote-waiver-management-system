'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, UserPlus, LogOut } from 'lucide-react';

interface AdminUser {
  id: number;
  username: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users');
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load admin users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check');
        if (response.status === 401 || !response.ok) {
          router.push('/admin/login');
        } else {
          const data = await response.json();
          setIsAuthenticated(true);
          setCurrentUsername(data.username || '');
          loadUsers();
        }
      } catch {
        router.push('/admin/login');
      }
    };
    checkAuth();
  }, [router, loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    setSuccess('');

    if (!newUsername || !newPassword) {
      setError('Username and password are required');
      setIsCreating(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsCreating(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
        }),
      });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin user');
      }

      setSuccess(data.message || 'Admin user created successfully');
      setNewUsername('');
      setNewPassword('');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete admin user "${username}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(userId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete admin user');
      }

      setSuccess(data.message || 'Admin user deleted successfully');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeletingId(null);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin/dashboard"
            className="btn btn-secondary flex items-center gap-2 w-fit"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Admin User Management</h1>
          <button
            onClick={handleLogout}
            className="btn btn-secondary flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {error && (
          <div className="card mb-6">
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="card mb-6">
            <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
              {success}
            </div>
          </div>
        )}

        {/* Create New Admin User Form */}
        <div className="card mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus size={24} />
            Create New Admin User
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="username">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  className="input"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="label" htmlFor="password">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  className="input"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Admin User'}
            </button>
          </form>
        </div>

        {/* Admin Users List */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            All Admin Users ({users.length})
          </h2>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading admin users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No admin users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">ID</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Username</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Created</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isCurrentUser = user.username.toLowerCase() === currentUsername.toLowerCase();
                    return (
                      <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600">{user.id}</td>
                        <td className="px-4 py-3 font-medium">
                          {user.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-sm text-blue-600 font-normal">(You)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {user.createdAt ? (() => {
                            try {
                              const date = new Date(user.createdAt);
                              if (isNaN(date.getTime())) {
                                return 'Invalid Date';
                              }
                              return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                            } catch {
                              return 'Invalid Date';
                            }
                          })() : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {isCurrentUser ? (
                            <span className="text-gray-400 text-sm">Cannot delete yourself</span>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              disabled={deletingId === user.id}
                              className="btn btn-danger text-sm py-1 px-3 flex items-center gap-1 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                              {deletingId === user.id ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
