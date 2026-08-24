import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Camping Waiver – Coyote',
  description:
    'Sign the camping release of liability for Coyote Airsoft & Paintball.',
};

export default function CampingWaiverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
