import { Analytics } from '@vercel/analytics/next'
import { Barlow_Condensed, DM_Mono, Manrope } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { SiteStructuredData } from '@/components/seo/site-structured-data'
import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from '@/lib/seo'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-body' })
const barlow = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display' })
const mono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-menu' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: 'Sports Talent Discovery & Scouting',
    template: '%s | Demo Day Ghana',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    siteName: SITE_NAME,
    title: 'Sports Talent Discovery & Scouting | Demo Day Ghana',
    description: SITE_DESCRIPTION,
    images: [{ url: '/logo.webp', alt: 'Demo Day Ghana sports talent discovery platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sports Talent Discovery & Scouting | Demo Day Ghana',
    description: SITE_DESCRIPTION,
    images: ['/logo.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-GH">
      <body className={`${manrope.variable} ${barlow.variable} ${mono.variable} antialiased`}>
        <SiteStructuredData />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
