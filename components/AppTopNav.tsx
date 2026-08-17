'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@coyote-force/ui';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  sublabel?: string;
  isActive: (pathname: string) => boolean;
};

const primaryItems: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Waivers',
    isActive: (p) => p.startsWith('/admin/dashboard') || p.startsWith('/admin/waivers'),
  },
  {
    href: '/admin/tickets',
    label: 'Event Tickets',
    sublabel: 'Ticket Counts',
    isActive: (p) => p.startsWith('/admin/tickets'),
  },
];

const moreItems: NavItem[] = [
  {
    href: '/admin/checkin',
    label: 'Check-In',
    isActive: (p) => p.startsWith('/admin/checkin'),
  },
  {
    href: '/admin/customers',
    label: 'Top customers',
    isActive: (p) => p.startsWith('/admin/customers'),
  },
  {
    href: '/admin/users',
    label: 'Admin',
    sublabel: 'Manage Users',
    isActive: (p) => p.startsWith('/admin/users'),
  },
];

const items: NavItem[] = [...primaryItems, ...moreItems];

function linkClass(active: boolean, opts?: { block?: boolean }) {
  const base = opts?.block
    ? 'block w-full rounded px-3 py-3 text-left text-sm font-medium transition-colors sm:py-2.5'
    : 'rounded px-2.5 py-2 text-sm font-medium transition-colors lg:px-3';
  return [
    base,
    active
      ? 'bg-primary/10 text-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <nav className="px-4" aria-label="Main">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-2">
          <Link
            href="/admin/dashboard"
            className="flex min-w-0 shrink items-center gap-2 font-heading text-sm font-semibold text-foreground hover:text-link-hover sm:gap-2.5 sm:text-base"
          >
            <Image
              src="/coyote-shield.png"
              alt=""
              width={148}
              height={176}
              className="h-8 w-auto shrink-0 sm:h-9"
              priority
            />
            <span className="truncate">Coyote Waiver</span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-end gap-1 lg:flex lg:gap-2">
            <ul className="flex flex-wrap items-center justify-end gap-0.5 sm:gap-1 lg:gap-2">
              {primaryItems.map(({ href, label, sublabel, isActive }) => {
                const active = isActive(pathname);
                return (
                  <li key={href}>
                    <Link href={href} className={linkClass(active)} aria-current={active ? 'page' : undefined}>
                      <span className="hidden xl:inline">
                        {label}
                        {sublabel ? (
                          <span className="whitespace-nowrap font-normal text-muted-foreground"> ({sublabel})</span>
                        ) : null}
                      </span>
                      <span className="xl:hidden">{href === '/admin/tickets' ? 'Tickets' : label}</span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={`${linkClass(moreItems.some((item) => item.isActive(pathname)))} inline-flex items-center gap-1`}
                  >
                    More
                    <ChevronDown size={14} className="shrink-0 opacity-70" aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {moreItems.map(({ href, label, sublabel, isActive }) => {
                      const active = isActive(pathname);
                      return (
                        <DropdownMenuItem key={href} asChild>
                          <Link href={href} aria-current={active ? 'page' : undefined}>
                            <span>
                              {label}
                              {sublabel ? (
                                <span className="font-normal text-muted-foreground"> ({sublabel})</span>
                              ) : null}
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            </ul>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              title="Log out"
            >
              <LogOut size={16} className="shrink-0" aria-hidden />
              Logout
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls={navId}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={22} strokeWidth={2} aria-hidden /> : <Menu size={22} strokeWidth={2} aria-hidden />}
          </Button>
        </div>
      </nav>

      <div
        id={navId}
        className={[
          'border-t border-border bg-background lg:hidden',
          menuOpen ? 'block' : 'hidden',
        ].join(' ')}
      >
        <div className="px-4">
          <ul className="mx-auto max-w-7xl divide-y divide-border py-1">
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
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{sublabel}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mx-auto max-w-7xl border-t border-border pb-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => void handleLogout()}
            >
              <LogOut size={18} aria-hidden />
              Log out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
