import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check-In – Coyote Waiver',
  description: 'Gate check-in: verify waivers and a player’s Webflow ticket purchases.',
};

export default function AdminCheckInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
