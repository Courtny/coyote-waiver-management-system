import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Waiver – Coyote',
  description: 'Sign the safety waiver for Coyote Airsoft & Paintball to get access to the field.',
}

export default function WaiverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
