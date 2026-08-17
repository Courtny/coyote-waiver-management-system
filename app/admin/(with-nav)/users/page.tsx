'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, UserPlus } from 'lucide-react';
import { Button, Input, Label } from '@coyote-force/ui';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { TableSkeleton } from '@/components/admin/TableSkeleton';

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

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <AdminPageShell title="Admin User Management" backHref="/admin/dashboard">
        {error && (
          <div className="rounded border border-border bg-card p-6 mb-6">
            <div className="p-4 bg-destructive/10 text-destructive rounded border border-destructive/30">
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="rounded border border-border bg-card p-6 mb-6">
            <div className="p-4 bg-status-green/10 text-status-green rounded border border-status-green/30">
              {success}
            </div>
          </div>
        )}

        {/* Create New Admin User Form */}
        <div className="rounded border border-border bg-card p-6 mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <UserPlus size={24} />
            Create New Admin User
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username *
                </Label>
                <Input
                  type="text"
                  id="username"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password *
                </Label>
                <Input
                  type="password"
                  id="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Admin User'}
            </Button>
          </form>
        </div>

        {/* Admin Users List */}
        <div className="rounded border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            All Admin Users ({users.length})
          </h2>
          {isLoading ? (
            <TableSkeleton columns={4} rows={6} ariaLabel="Loading admin users" />
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No admin users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="px-4 py-3 text-left text-foreground font-semibold">ID</th>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">Username</th>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">Created</th>
                    <th className="px-4 py-3 text-left text-foreground font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isCurrentUser = user.username.toLowerCase() === currentUsername.toLowerCase();
                    return (
                      <tr key={user.id} className="border-b border-border hover:bg-muted transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{user.id}</td>
                        <td className="px-4 py-3 font-medium">
                          {user.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-sm text-brand font-normal">(You)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
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
                            <span className="text-muted-foreground text-sm">Cannot delete yourself</span>
                          ) : (
                            <Button
                              variant="destructive-solid"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              disabled={deletingId === user.id}
                            >
                              <Trash2 size={16} />
                              {deletingId === user.id ? 'Deleting...' : 'Delete'}
                            </Button>
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
    </AdminPageShell>
  );
}
