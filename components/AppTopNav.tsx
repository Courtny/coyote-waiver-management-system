'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';

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

function linkClass(active: boolean, opts?: { block?: boolean }) {
  const base = opts?.block
    ? 'block w-full rounded-md px-3 py-3 text-left text-sm font-medium transition-colors sm:py-2.5'
    : 'rounded-md px-2.5 py-2 text-sm font-medium transition-colors lg:px-3';
  return [
    base,
    active
      ? 'bg-blue-50 text-blue-700'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  ].join(' ');
}

export default function AppTopNav() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navId = 'admin-main-nav-menu';

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm">
      <nav
        className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4"
        aria-label="Main"
      >
        <Link
          href="/"
          className="min-w-0 shrink truncate text-sm font-semibold text-gray-900 hover:text-blue-700 sm:text-base"
        >
          Coyote Waiver
        </Link>

        {/* Desktop / tablet: inline nav */}
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-1 lg:flex lg:gap-2">
          <ul className="flex flex-wrap items-center justify-end gap-0.5 sm:gap-1 lg:gap-2">
            {items.map(({ href, label, sublabel, isActive }) => {
              const active = isActive(pathname);
              return (
                <li key={href}>
                  <Link href={href} className={linkClass(active)} aria-current={active ? 'page' : undefined}>
                    <span className="hidden xl:inline">
                      {label}
                      {sublabel ? (
                        <span className="whitespace-nowrap font-normal text-gray-500"> ({sublabel})</span>
                      ) : null}
                    </span>
                    <span className="xl:hidden">
                      {href === '/admin/tickets' ? 'Tickets' : href === '/admin/users' ? 'Users' : label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            title="Log out"
          >
            <LogOut size={16} className="shrink-0" aria-hidden />
            <span>Logout</span>
          </button>
        </div>

        {/* Narrow: menu toggle */}
        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center rounded-md p-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls={navId}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={22} strokeWidth={2} aria-hidden /> : <Menu size={22} strokeWidth={2} aria-hidden />}
        </button>
      </nav>

      {/* Mobile / narrow panel */}
      <div
        id={navId}
        className={[
          'border-t border-gray-100 bg-white lg:hidden',
          menuOpen ? 'block' : 'hidden',
        ].join(' ')}
      >
        <ul className="mx-auto max-w-7xl divide-y divide-gray-100 px-2 py-1 sm:px-4">
          {items.map(({ href, label, sublabel, isActive }) => {
            const active = isActive(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={linkClass(active, { block: true })}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="block">{label}</span>
                  {sublabel ? (
                    <span className="mt-0.5 block text-xs font-normal text-gray-500">{sublabel}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mx-auto max-w-7xl border-t border-gray-100 px-2 pb-3 pt-1 sm:px-4">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <LogOut size={18} aria-hidden />
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
