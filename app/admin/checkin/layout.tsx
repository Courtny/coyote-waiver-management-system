import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check-In – Coyote Waiver',
  description: 'Event check-in: verify waivers and Webflow ticket purchases.',
};

export default function AdminCheckInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
