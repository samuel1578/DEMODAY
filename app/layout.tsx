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
    default: 'Demo Day Ghana | Sports Scouting & Athlete Evaluation',
    template: '%s | Demo Day Ghana',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    url: SITE_ORIGIN,
    locale: 'en_GH',
    siteName: SITE_NAME,
    title: 'Demo Day Ghana | Sports Scouting & Athlete Evaluation',
    description: SITE_DESCRIPTION,
    images: [{
      url: '/opengraph-image.png',
      width: 1200,
      height: 630,
      alt: 'Demo Day: Sports scouting in Ghana',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Demo Day Ghana | Sports Scouting & Athlete Evaluation',
    description: SITE_DESCRIPTION,
    images: ['/twitter-image.png'],
  },
  alternates: { canonical: '/' },
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
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
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
