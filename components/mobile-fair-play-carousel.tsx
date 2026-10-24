'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { humanIcon, proofIcon, sportsIcon } from '@/data/site'

const advantages = [
  {
    number: '01',
    title: 'Open access',
    description: 'No pay-to-play gatekeeping. Show up with your game.',
  },
  {
    number: '02',
    title: 'Proof over hype',
    description: 'Structured evaluations make potential legible.',
  },
  {
    number: '03',
    title: 'Human context',
    description: 'Every profile keeps the person behind the performance in view.',
  },
]

export function MobileFairPlayCarousel() {
  const track = useRef<HTMLDivElement>(null)
  const activeIndex = useRef(0)
  const [activeSlide, setActiveSlide] = useState(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return

    const interval = window.setInterval(() => {
      if (!window.matchMedia('(max-width: 767px)').matches) return
      const carousel = track.current
      if (!carousel) return

      const nextSlide = (activeIndex.current + 1) % advantages.length
      activeIndex.current = nextSlide
      setActiveSlide(nextSlide)
      carousel.scrollTo({ left: nextSlide * carousel.clientWidth, behavior: 'smooth' })
    }, 1500)

    return () => window.clearInterval(interval)
  }, [reducedMotion])

  function updateActiveSlide() {
    const carousel = track.current
    if (!carousel || !carousel.clientWidth) return

    const nextSlide = Math.round(carousel.scrollLeft / carousel.clientWidth)
    if (nextSlide === activeIndex.current) return
    activeIndex.current = nextSlide
    setActiveSlide(nextSlide)
  }

  function goToSlide(index: number) {
    const carousel = track.current
    if (!carousel) return

    activeIndex.current = index
    setActiveSlide(index)
    carousel.scrollTo({
      left: index * carousel.clientWidth,
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <div className="mt-12 md:hidden">
      <div
        ref={track}
        role="region"
        aria-label="Fair-play advantages"
        aria-roledescription="carousel"
        onScroll={updateActiveSlide}
        className="mobile-fair-play-track flex snap-x snap-mandatory overflow-x-auto"
      >
        {advantages.map((advantage, index) => (
          <article
            key={advantage.number}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${advantages.length}`}
            className="relative w-full shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-6"
          >
            <img
              src={advantage.title === 'Open access' ? sportsIcon : advantage.title === 'Proof over hype' ? proofIcon : humanIcon}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-5 top-5 size-20 opacity-20 brightness-0 invert"
            />
            <div className="relative z-10">
              <span className="text-sm font-black text-[#F4D03F]">{advantage.number}</span>
              <h3 className="mt-8 text-2xl font-black uppercase tracking-tight">{advantage.title}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{advantage.description}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 flex justify-center gap-2" aria-label="Choose a fair-play advantage">
        {advantages.map((advantage, index) => (
          <button
            key={advantage.number}
            type="button"
            aria-label={`Show slide ${index + 1}: ${advantage.title}`}
            aria-pressed={activeSlide === index}
            onClick={() => goToSlide(index)}
            className={`size-2.5 rounded-full transition-colors ${activeSlide === index ? 'bg-[#F4D03F]' : 'bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  )
}
