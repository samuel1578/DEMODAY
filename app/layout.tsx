import { Analytics } from '@vercel/analytics/next'
import { Barlow_Condensed, DM_Mono, Manrope } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-body' })
const barlow = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display' })
const mono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-menu' })

export const metadata: Metadata = {
  title: 'Demo Day | Talent Has No Backdoor',
  description: 'A transparent, connection-free pathway for athletes to be discovered, evaluated, and given a fair shot.',
  generator: 'v0.app',
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
    <html lang="en">
      <body className={`${manrope.variable} ${barlow.variable} ${mono.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
