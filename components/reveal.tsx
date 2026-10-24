'use client'

import { useEffect, useRef } from 'react'
import { animate, motion, stagger, useReducedMotion } from 'framer-motion'

const yellowSectionBackgrounds = new Set(['rgb(233, 196, 106)', 'rgb(244, 208, 63)'])

function collectHoverTargets(section: HTMLElement) {
  const targets: HTMLElement[] = []
  const collect = (element: HTMLElement) => {
    if (element.hasAttribute('data-motion-reveal')) {
      targets.push(element)
      return
    }

    const children = Array.from(element.children) as HTMLElement[]
    if (!children.some((child) => child.hasAttribute('data-motion-reveal') || child.querySelector('[data-motion-reveal]'))) {
      targets.push(element)
      return
    }

    children.forEach(collect)
  }

  Array.from(section.children).forEach((child) => collect(child as HTMLElement))
  return targets
}

export function PageMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const root = scope.current
    if (!root || shouldReduceMotion) return

    const cleanups: Array<() => void> = []

    root.querySelectorAll('section').forEach((section) => {
      const isYellowSection = yellowSectionBackgrounds.has(getComputedStyle(section).backgroundColor)
      const content = Array.from(section.children).filter((element) => !element.hasAttribute('data-motion-reveal') && !element.querySelector('[data-motion-reveal]')) as HTMLElement[]

      if (content.length && !isYellowSection) {
        animate(content, { y: [18, 0] }, {
          duration: 0.65,
          delay: stagger(0.08),
          ease: [0.22, 1, 0.36, 1],
        })
      }

      if (!isYellowSection) return
      const hoverContent = collectHoverTargets(section)
      if (!hoverContent.length) return

      const raiseContent = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        animate(hoverContent, { y: -7 }, { duration: 0.3, ease: [0.22, 1, 0.36, 1] })
      }
      const resetContent = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        animate(hoverContent, { y: 0 }, { duration: 0.42, ease: [0.22, 1, 0.36, 1] })
      }

      section.addEventListener('pointerenter', raiseContent)
      section.addEventListener('pointerleave', resetContent)
      cleanups.push(() => {
        section.removeEventListener('pointerenter', raiseContent)
        section.removeEventListener('pointerleave', resetContent)
      })
    })

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [shouldReduceMotion])

  return <div ref={scope}>{children}</div>
}

export function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <motion.div data-motion-reveal initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>{children}</motion.div>
}

export function MotionMedia({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return <motion.img src={src} alt={alt} className={className} whileHover={{ scale: 1.035 }} transition={{ duration: 0.5 }} />
}

export function Ticker() {
  return <div className="overflow-hidden border-y border-white/10 bg-[#e9c46a] py-3 text-[#172219]"><motion.div animate={{ x: ['0%', '-50%'] }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }} className="flex w-max gap-12 whitespace-nowrap text-xs font-black uppercase tracking-[0.24em]">{Array.from({ length: 8 }, (_, i) => <span key={i}>Fair play / Real opportunity / Demo Day</span>)}</motion.div></div>
}

export function SignalCard({ number, title, children, delay = 0, artwork }: { number: string; title: string; children: React.ReactNode; delay?: number; artwork?: string }) {
  return <Reveal delay={delay} className="motion-hover-card relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-6">
    {artwork && <img src={artwork} alt="" aria-hidden="true" className="signal-card-artwork pointer-events-none absolute right-5 top-5 size-20 opacity-20 brightness-0 invert" />}
    <div className="relative z-10"><span className="text-sm font-black text-[#F4D03F]">{number}</span><h3 className="mt-8 text-2xl font-black uppercase tracking-tight">{title}</h3><p className="mt-3 leading-7 text-muted-foreground">{children}</p></div>
  </Reveal>
}
