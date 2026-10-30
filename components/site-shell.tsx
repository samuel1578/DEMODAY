'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { PageMotion } from '@/components/reveal'
import { AuthNavControls } from '@/components/auth/auth-nav-controls'
import { LegacyProfileCredentialCleanup } from '@/components/auth/legacy-profile-credential-cleanup'
import { humanIcon, logo, proofIcon, siteNav, sportsIcon, upgradeIcon } from '@/data/site'

const menuMarqueeItems = [
  { icon: sportsIcon, label: 'Open access' },
  { icon: proofIcon, label: 'Proof over hype' },
  { icon: humanIcon, label: 'Human context' },
  { icon: upgradeIcon, label: 'Next level' },
]

export function SiteShell({ children, current }: { children: React.ReactNode; current: string }) {
  const [dark, setDark] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('demo-day-theme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setDark(savedTheme === 'dark')
    }
  }, [])

  useEffect(() => {
    const mobileViewport = window.matchMedia('(max-width: 767px)')
    if (!open || !mobileViewport.matches) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches) setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    mobileViewport.addEventListener('change', closeOnDesktop)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
      mobileViewport.removeEventListener('change', closeOnDesktop)
    }
  }, [open])

  function toggleTheme() {
    const nextDark = !dark
    setDark(nextDark)
    window.localStorage.setItem('demo-day-theme', nextDark ? 'dark' : 'light')
  }

  const headerTheme = dark
    ? 'border-white/10 bg-[#101612]/90 text-white'
    : 'border-[#172219]/10 bg-[#f6f6ef]/95 text-[#172219]'
  const menuSurfaceTheme = dark
    ? 'border-white/10 bg-[#101612]'
    : 'border-[#172219]/10 bg-[#f6f6ef]'

  return (
    <main data-theme={dark ? 'dark' : 'light'} className={dark ? 'min-h-screen bg-[#101612] text-white' : 'min-h-screen bg-[#f6f6ef] text-[#172219]'}>
      <LegacyProfileCredentialCleanup />
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${headerTheme} ${open ? `max-md:fixed max-md:inset-0 max-md:flex max-md:h-[100dvh] max-md:flex-col max-md:overflow-y-auto ${dark ? 'max-md:bg-[#101612]' : 'max-md:bg-[#f6f6ef]'}` : ''}`}>
        <div className={`mx-auto flex w-full max-w-7xl flex-col md:flex-row md:items-center md:justify-between ${open ? 'max-md:flex-1' : ''}`}>
          <div className={`flex shrink-0 items-center justify-between px-5 py-4 lg:px-8 ${open ? `max-md:border-b ${dark ? 'max-md:border-white/10' : 'max-md:border-[#172219]/10'}` : ''}`}>
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
              <img src={logo} alt="Demo Day sports logo" className={`rounded-full object-cover transition-[width,height] duration-300 ${open ? 'size-16 max-[360px]:size-14 md:size-11' : 'size-11'}`} />
              <span className={`brand-wordmark ${open ? 'mobile-brand-wordmark' : ''}`}>DEMO DAY <small>Sports talent discovery in Ghana</small></span>
            </Link>
            <button className={`rounded-md border p-2 transition md:hidden ${dark ? 'border-white/15 text-white hover:border-[#F4D03F] hover:text-[#F4D03F]' : 'border-[#172219]/20 text-[#172219] hover:border-[#1e5128] hover:text-[#1e5128]'}`} onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="site-navigation">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
          <nav id="site-navigation" className={`${open ? 'flex' : 'hidden'} menu-type w-full flex-col gap-1 border-b px-6 pb-8 pt-6 md:static md:flex md:w-auto md:flex-row md:items-center md:gap-7 md:border-0 md:bg-transparent md:p-0 ${menuSurfaceTheme} ${open ? 'max-md:flex-1' : ''}`}>
            <div className="mobile-nav-links">
              {siteNav.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`nav-link mobile-menu-link ${current === item.href ? 'mobile-menu-link-current' : ''}`}>{item.label}</Link>)}
            </div>
            <div className="mobile-menu-marquee" aria-hidden="true">
              <div className="mobile-menu-marquee-track">
                {[0, 1].map(copy => (
                  <span className="mobile-menu-marquee-group" key={copy}>
                    {menuMarqueeItems.map(item => (
                      <span className="mobile-menu-marquee-item" key={`${copy}-${item.label}`}>
                        <img src={item.icon} alt="" />
                        <span>{item.label}</span>
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
            <div className="mobile-menu-controls">
              <button onClick={toggleTheme} aria-label="Toggle color mode" className={`mobile-menu-theme flex items-center gap-2 py-3 md:py-0 ${dark ? 'text-white/65' : 'text-[#172219]/70'}`}>
                {dark ? <Sun /> : <Moon />}
                <span className="md:hidden">{dark ? 'Light mode' : 'Dark mode'}</span>
              </button>
              <AuthNavControls dark={dark} />
            </div>
          </nav>
        </div>
      </header>
      <PageMotion>{children}</PageMotion>
      <footer className="border-t border-white/10 bg-[#0b100d]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <img src={logo} alt="Demo Day sports logo" className="size-12 rounded-full object-cover" />
            <span className="brand-wordmark">DEMO DAY <small>Sports talent discovery in Ghana</small></span>
          </Link>
          <div className="menu-type flex flex-wrap gap-5 text-sm text-white/60">{siteNav.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</div>
          <p className="text-xs text-white/35">© 2026 Demo Day Ghana. Sports talent discovery and scouting.</p>
        </div>
      </footer>
    </main>
  )
}
