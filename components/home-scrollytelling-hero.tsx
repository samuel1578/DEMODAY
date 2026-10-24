'use client'

import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const scenes = [
  {
    label: 'Open the field',
    title: <>Talent has no <span className="text-[#F4D03F]">backdoor.</span></>,
    description: 'A fair shot starts with an open door. Every athlete can step into the pathway without needing the right introduction.',
  },
  {
    label: 'Proof over proximity',
    title: <>Let the game <span className="text-[#F4D03F]">speak.</span></>,
    description: 'Balanced teams and structured, documented evaluations put performance—not connections—at the center.',
  },
  {
    label: 'Opportunity with accountability',
    title: <>Built to move talent <span className="text-[#F4D03F]">forward.</span></>,
    description: 'Verified scouts, multiple perspectives, and safeguarding at every stage help make the next step a responsible one.',
  },
]

function NetworkVisual() {
  return (
    <div className="relative flex aspect-square w-full max-w-[34rem] items-center justify-center">
      <div className="hero-network-glow absolute size-[72%] rounded-full bg-[#2d6a4f]/70 blur-[70px]" />
      <svg aria-hidden="true" viewBox="0 0 520 520" className="absolute inset-0 size-full text-[#F4D03F]/55">
        <circle cx="260" cy="260" r="210" fill="none" stroke="currentColor" strokeDasharray="3 10" />
        <circle cx="260" cy="260" r="160" fill="none" stroke="currentColor" strokeOpacity=".45" />
        <path d="M72 180 187 224M448 156 331 220M91 365l115-67m225 70-111-67M257 48v90m3 244v90" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="72" cy="180" r="6" fill="#F4D03F" />
        <circle cx="448" cy="156" r="6" fill="#F4D03F" />
        <circle cx="91" cy="365" r="6" fill="#F4D03F" />
        <circle cx="431" cy="368" r="6" fill="#F4D03F" />
        <circle cx="257" cy="48" r="6" fill="#F4D03F" />
        <circle cx="260" cy="472" r="6" fill="#F4D03F" />
      </svg>
      <div className="absolute size-[78%] rounded-full border border-white/10" />
      <img
        src="/logo.webp"
        alt="Demo Day athlete network logo"
        className="relative z-10 w-[68%] drop-shadow-[0_0_45px_rgba(244,208,63,0.22)]"
      />
      <div className="absolute bottom-[8%] left-0 rounded-md border border-white/10 bg-[#101612]/85 px-4 py-3 backdrop-blur max-md:hidden">
        <span className="block text-[10px] uppercase tracking-[0.2em] text-white/45">Live talent network</span>
        <b className="mt-1 block text-sm text-[#F4D03F]">04,280 athletes</b>
      </div>
      <div className="absolute right-0 top-[13%] rounded-md border border-white/10 bg-[#101612]/85 px-4 py-3 backdrop-blur max-md:hidden">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/75">
          <Users className="size-4 text-[#F4D03F]" /> Every athlete welcome
        </span>
      </div>
    </div>
  )
}

function EvidenceVisual() {
  return (
    <div className="relative flex aspect-[1.08] w-full max-w-[34rem] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#131a15]/90 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(45,106,79,.55),transparent_60%)]" />
      <div aria-hidden="true" className="absolute bottom-[13%] left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-[#F4D03F]/70 to-transparent" />
      <div aria-hidden="true" className="absolute bottom-[13%] left-[17%] right-[17%] h-16 rounded-[50%] border border-[#F4D03F]/20" />
      <img
        src="/icons/hero2.svg"
        alt="Runner driving forward"
        className="relative z-10 h-[72%] w-[72%] object-contain brightness-0 invert drop-shadow-[0_12px_32px_rgba(244,208,63,0.22)]"
      />
      <div className="absolute bottom-4 right-4 max-w-[12rem] rounded-lg border border-white/10 bg-[#101612]/90 px-4 py-3 backdrop-blur sm:bottom-6 sm:right-6">
        <span className="block text-[10px] uppercase tracking-[0.18em] text-white/45">On the field</span>
        <span className="mt-1 block text-sm font-bold text-white">Let the game speak.</span>
      </div>
    </div>
  )
}

function TrustVisual() {
  return (
    <div className="relative flex aspect-[1.08] w-full max-w-[34rem] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#131a15]/90 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(45,106,79,.55),transparent_65%)]" />
      <div aria-hidden="true" className="absolute bottom-[-14%] left-[8%] size-[84%] rounded-full border border-[#F4D03F]/20" />
      <div aria-hidden="true" className="absolute bottom-[-22%] left-[19%] size-[62%] rounded-full border border-white/10" />
      <img
        src="/icons/winners.svg"
        alt="Two athletes running competitively side by side"
        className="relative z-10 h-[72%] w-[82%] object-contain brightness-0 invert drop-shadow-[0_12px_32px_rgba(244,208,63,0.22)]"
      />
      <div className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-[#101612]/90 px-4 py-3 backdrop-blur sm:bottom-6 sm:left-6">
        <span className="block text-[10px] uppercase tracking-[0.18em] text-white/45">Opportunity with accountability</span>
        <span className="mt-1 block text-sm font-bold text-white">Every step, supported.</span>
      </div>
    </div>
  )
}

const visuals = [NetworkVisual, EvidenceVisual, TrustVisual]

export function HomeScrollytellingHero() {
  const container = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const [activeScene, setActiveScene] = useState(0)
  const scrollYProgress = useMotionValue(0)
  useEffect(() => {
    const updateProgress = () => {
      const bounds = container.current?.getBoundingClientRect()
      if (!bounds) return
      const scrollRange = Math.max(1, bounds.height - window.innerHeight)
      scrollYProgress.set(Math.min(1, Math.max(0, -bounds.top / scrollRange)))
    }
    let frame = 0
    const scheduleUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        updateProgress()
      })
    }
    updateProgress()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      window.cancelAnimationFrame(frame)
    }
  }, [scrollYProgress])
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    setActiveScene(progress < 0.34 ? 0 : progress < 0.67 ? 1 : 2)
  })
  const sceneStyles = [
    {
      opacity: useTransform(scrollYProgress, [0, 0.28, 0.38], [1, 1, 0]),
      y: useTransform(scrollYProgress, [0, 0.38], ['0%', '-5%']),
    },
    {
      opacity: useTransform(scrollYProgress, [0.28, 0.39, 0.61, 0.72], [0, 1, 1, 0]),
      y: useTransform(scrollYProgress, [0.28, 0.39, 0.72], ['5%', '0%', '-5%']),
    },
    {
      opacity: useTransform(scrollYProgress, [0.61, 0.73, 1], [0, 1, 1]),
      y: useTransform(scrollYProgress, [0.61, 0.73], ['5%', '0%']),
    },
  ]

  return (
    <div
      ref={container}
      className={reducedMotion ? 'relative text-white' : 'relative h-[300svh] text-white'}
      aria-label="Three-part story about the Demo Day talent pathway"
    >
      <div className={reducedMotion ? 'relative' : 'sticky top-[77px] h-[calc(100svh-77px)] min-h-[620px]'}>
        <div className="absolute inset-0 overflow-hidden border-b border-white/10 bg-[#101612]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_40%,rgba(45,106,79,.3),transparent_34%),linear-gradient(115deg,#101612_22%,#173923_100%)]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          {!reducedMotion && (
            <>
              <div className="absolute inset-x-5 top-4 z-30 h-0.5 origin-left bg-white/10 sm:inset-x-8">
                <motion.div className="h-full origin-left bg-[#F4D03F]" style={{ scaleX: scrollYProgress }} />
              </div>
              <div className="absolute right-5 top-8 z-30 font-mono text-[10px] tracking-[0.2em] text-white/40 sm:right-8">
                SCROLL TO EXPLORE
              </div>
            </>
          )}
        </div>

        {scenes.map((scene, index) => {
          const Visual = visuals[index]
          const styles = sceneStyles[index]
          return (
            <motion.article
              key={scene.label}
              className={reducedMotion
                ? 'relative grid min-h-[calc(100svh-77px)] items-center border-b border-white/10 px-5 py-16 sm:px-8 lg:px-12'
                : 'absolute inset-0 grid items-center px-5 pb-12 pt-16 sm:px-8 lg:px-12'}
              style={reducedMotion ? undefined : { opacity: styles.opacity, y: styles.y }}
              aria-hidden={!reducedMotion && activeScene !== index}
              inert={!reducedMotion && activeScene !== index}
              aria-label={`Scene ${index + 1}: ${scene.label}`}
            >
              <div className={`relative mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[1fr_0.95fr] lg:gap-12 ${index === 0 ? 'min-h-[calc(100svh-180px)]' : ''}`}>
                <div className={index === 0 ? 'relative z-10 lg:z-auto' : index === 1 ? 'order-2 lg:order-1' : ''}>
                  <p className="eyebrow">
                    <span className="mr-3 font-mono text-white/35">0{index + 1} / 03</span>
                    {scene.label}
                  </p>
                  <h1 className="mt-6 max-w-3xl text-5xl font-black uppercase leading-[.9] tracking-[-0.065em] sm:text-7xl lg:text-[clamp(4.5rem,7vw,7.5rem)]">
                    {scene.title}
                  </h1>
                  <p className="mt-6 max-w-xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
                    {scene.description}
                  </p>
                  {index === 0 && (
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Link href="/sign-up" className="group flex items-center justify-center gap-3 rounded-md bg-[#F4D03F] px-6 py-3.5 font-bold text-[#172219]">
                        Enter the pathway <ArrowRight className="transition group-hover:translate-x-1" />
                      </Link>
                      <Link href="/teams" className="flex items-center justify-center gap-3 rounded-md border border-white/25 px-6 py-3.5 font-bold">
                        Scout portal <ArrowRight />
                      </Link>
                    </div>
                  )}
                  {index === 2 && (
                    <Link href="/sign-up" className="mt-8 inline-flex items-center gap-3 rounded-md bg-[#F4D03F] px-6 py-3.5 font-bold text-[#172219]">
                      Start your pathway <ArrowRight />
                    </Link>
                  )}
                </div>
                <div className={index === 0
                  ? 'pointer-events-none absolute right-[2%] top-[3%] z-0 w-[44%] opacity-20 md:right-[-12%] md:top-[23%] md:w-[76%] md:opacity-45 lg:pointer-events-auto lg:relative lg:right-auto lg:top-auto lg:z-auto lg:w-auto lg:opacity-100'
                  : index === 1 ? 'order-1 flex justify-center lg:order-2' : 'flex justify-center'}>
                  <Visual />
                </div>
              </div>
            </motion.article>
          )
        })}
      </div>
    </div>
  )
}
