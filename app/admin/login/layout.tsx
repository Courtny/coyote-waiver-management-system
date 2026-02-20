import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Sign In – Coyote Waiver',
  description: 'Sign in to the Coyote Waiver admin dashboard.',
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
