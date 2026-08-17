'use client';

import Link from 'next/link';
import { Button } from '@coyote-force/ui';
import { ArrowLeft } from 'lucide-react';

export type AdminPageShellProps = {
  title: string;
  description?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export default function AdminPageShell({
  title,
  description,
  backHref,
  backLabel = 'Back to dashboard',
  actions,
  children,
}: AdminPageShellProps) {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {backHref ? (
              <Button variant="ghost" size="sm" className="mb-2" asChild>
                <Link href={backHref}>
                  <ArrowLeft size={16} className="shrink-0" aria-hidden />
                  {backLabel}
                </Link>
              </Button>
            ) : null}
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description ? <div className="mt-1 text-muted-foreground">{description}</div> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
        {children}
      </div>
    </div>
  );
}
