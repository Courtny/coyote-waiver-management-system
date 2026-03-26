import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard – Coyote Waiver',
  description: 'Admin dashboard for managing waivers. Coyote Waiver Management System.',
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
