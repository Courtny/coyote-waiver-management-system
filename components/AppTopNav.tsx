'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  sublabel?: string;
  isActive: (pathname: string) => boolean;
};

const items: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Waivers',
    isActive: (p) => p.startsWith('/admin/dashboard') || p.startsWith('/admin/waivers'),
  },
  {
    href: '/admin/checkin',
    label: 'Check-In',
    isActive: (p) => p.startsWith('/admin/checkin'),
  },
  {
    href: '/admin/tickets',
    label: 'Event Tickets',
    sublabel: 'Ticket Counts',
    isActive: (p) => p.startsWith('/admin/tickets'),
  },
  {
    href: '/admin/users',
    label: 'Admin',
    sublabel: 'Manage Users',
    isActive: (p) => p.startsWith('/admin/users'),
  },
];

function linkClass(active: boolean) {
  return [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    active
      ? 'bg-blue-50 text-blue-700'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  ].join(' ');
}

export default function AppTopNav() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const isLogin = pathname === '/admin/login';

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm">
      <nav
        className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4"
        aria-label="Main"
      >
        <Link
          href="/"
          className="shrink-0 text-sm font-semibold text-gray-900 hover:text-blue-700"
        >
          Coyote Waiver
        </Link>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1 sm:gap-2">
          <ul className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            {items.map(({ href, label, sublabel, isActive }) => {
              const active = isActive(pathname);
              return (
                <li key={href}>
                  <Link href={href} className={linkClass(active)} aria-current={active ? 'page' : undefined}>
                    {label}
                    {sublabel ? (
                      <>
                        {' '}
                        <span className="whitespace-nowrap font-normal text-gray-500">({sublabel})</span>
                      </>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          {!isLogin ? (
            <button
              type="button"
              onClick={handleLogout}
              className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title="Log out"
            >
              <LogOut size={16} className="shrink-0" aria-hidden />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
