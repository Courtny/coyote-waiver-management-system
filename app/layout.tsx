import type { Metadata } from 'next'
import { Libre_Franklin } from 'next/font/google'
import './globals.css'

const libreFranklin = Libre_Franklin({
  subsets: ['latin'],
  variable: '--font-libre-franklin',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Coyote Waiver',
  description: 'A secure and real-time digital waiver signing and management system for businesses.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={libreFranklin.variable}>
      <body>{children}</body>
    </html>
  )
}
