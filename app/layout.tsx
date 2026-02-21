import type { Metadata } from 'next'
import { Libre_Franklin } from 'next/font/google'
import './globals.css'

const libreFranklin = Libre_Franklin({
  subsets: ['latin'],
  variable: '--font-libre-franklin',
  display: 'swap',
})

// Base URL for OG/canonical: prefer explicit site URL, then Vercel deployment URL, else localhost
const explicitSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`.replace(/\/$/, '') : ''
const baseUrl = explicitSiteUrl || vercelUrl
const siteUrl = baseUrl

const defaultTitle = 'Coyote Waiver'
const defaultDescription =
  'A secure and real-time digital waiver signing and management system for businesses.'
const ogImageUrl = baseUrl ? `${baseUrl}/og.png` : '/og.png'

export const metadata: Metadata = {
  metadataBase: baseUrl ? new URL(baseUrl) : new URL('http://localhost:3000'),
  title: defaultTitle,
  description: defaultDescription,
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: siteUrl || undefined,
    siteName: 'Coyote Waiver',
    images: [{ url: ogImageUrl, width: 1200, height: 630, alt: 'Coyote Airsoft & Paintball' }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: [ogImageUrl],
  },
  ...(siteUrl && { alternates: { canonical: siteUrl } }),
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
