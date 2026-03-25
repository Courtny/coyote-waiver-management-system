import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ticket counts – Coyote Waiver',
  description: 'Webflow ticket totals by product and SKU.',
};

export default function AdminTicketsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
