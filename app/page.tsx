import Link from 'next/link'
import { ArrowRight, BarChart3, Eye, ShieldCheck } from 'lucide-react'
import { HomeScrollytellingHero } from '@/components/home-scrollytelling-hero'
import { HomeSpotlightEvent } from '@/components/home-spotlight-event'
import { MobileFairPlayCarousel } from '@/components/mobile-fair-play-carousel'
import { MotionMedia, Reveal, SignalCard, Ticker } from '@/components/reveal'
import { SiteShell } from '@/components/site-shell'
import { humanIcon, logo, pexelsImages, proofIcon, sportsIcon, upgradeIcon } from '@/data/site'

export default function Home() {
  return (
    <SiteShell current="/">
      <HomeScrollytellingHero />
      <HomeSpotlightEvent />
      <Ticker />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <Reveal>
          <p className="eyebrow">The fair-play advantage</p>
          <h2 className="section-title max-w-2xl">A better system creates better moments.</h2>
        </Reveal>
        <div className="mt-12 hidden gap-5 md:grid md:grid-cols-3">
          <SignalCard number="01" title="Open access" artwork={sportsIcon}>No pay-to-play gatekeeping. Show up with your game.</SignalCard>
          <SignalCard number="02" title="Proof over hype" artwork={proofIcon}>Structured evaluations make potential legible.</SignalCard>
          <SignalCard number="03" title="Human context" artwork={humanIcon}>Every profile keeps the person behind the performance in view.</SignalCard>
        </div>
        <MobileFairPlayCarousel />
      </section>
      <section className="border-y border-white/10 bg-[#e9c46a] text-[#172219]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-16 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <p className="eyebrow">One network. Many next levels.</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-[.9] tracking-tight sm:text-5xl">Make the right introduction.</h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2">
            <div><Eye /><h3 className="mt-3 text-xl font-black">Be seen</h3><p className="mt-2 text-sm leading-6">A profile built around evidence, not access.</p></div>
            <div><BarChart3 /><h3 className="mt-3 text-xl font-black">Be ready</h3><p className="mt-2 text-sm leading-6">Know exactly what to improve next.</p></div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
        <Reveal>
          <p className="eyebrow">Built for the whole ecosystem</p>
          <h2 className="section-title">The field is bigger than the pitch.</h2>
          <p className="mt-5 max-w-lg leading-7 text-muted-foreground">Athletes, teams, coaches, and safeguarding leads move through one accountable experience. Less noise. More signal. Better outcomes.</p>
          <Link href="/safeguarding" className="mt-7 inline-flex items-center gap-2 font-bold text-[#F4D03F]">See our standards <ShieldCheck /></Link>
        </Reveal>
        <Reveal delay={.1} className="grid grid-cols-[.9fr_1.1fr] items-center gap-3 sm:gap-5">
          <div className="overflow-hidden rounded-xl">
            <MotionMedia src={pexelsImages.team} alt="Team huddle" className="h-[260px] w-full object-cover sm:h-[360px] lg:h-[420px]" />
          </div>
          <div className="mt-10 overflow-hidden rounded-xl bg-[#101612]/60 sm:mt-14">
            <MotionMedia src={pexelsImages.training} alt="Athlete training" className="h-[220px] w-full object-contain sm:h-[300px] lg:h-[320px]" />
          </div>
        </Reveal>
      </section>
      <section className="relative overflow-hidden bg-[#1e5128] px-5 pb-20 pt-36 text-center text-white md:py-20">
        <img src={upgradeIcon} alt="" aria-hidden="true" className="absolute left-5 top-5 size-20 rounded-full bg-[#F4D03F] p-3 object-contain md:left-12 md:top-1/2 md:size-36 md:-translate-y-1/2 md:p-5 lg:left-[10%] lg:size-44" />
        <img src={logo} alt="Demo Day sports logo" className="mx-auto mb-5 size-20 rounded-full object-cover md:size-10" />
        <h2 className="mx-auto max-w-3xl text-4xl font-black uppercase tracking-tight sm:text-6xl">Your next level starts with a fair shot.</h2>
        <Link href="/how-it-works" className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#F4D03F] px-6 py-3.5 font-bold text-[#172219]">Learn how it works <ArrowRight /></Link>
      </section>
    </SiteShell>
  )
}
