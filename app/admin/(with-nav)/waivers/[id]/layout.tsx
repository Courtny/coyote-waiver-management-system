import type { Metadata } from 'next'

type Props = {
  params: { id: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params
  return {
    title: `Waiver ${id} – Coyote Waiver`,
    description: `View waiver details. Coyote Waiver Management System.`,
  }
}

export default function WaiverDetailLayout({ children }: Props) {
  return children
}
