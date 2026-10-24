import { ArrowRight, BarChart3, Eye, Layers3, Radar } from 'lucide-react'
import { MotionMedia, Reveal, SignalCard } from '@/components/reveal'
import { SiteShell } from '@/components/site-shell'
import { signalIcon, teamIcon, teamsHeroImage, timeIcon } from '@/data/site'

export default function Teams() {
  return (
    <SiteShell current="/teams">
      <section className="overflow-hidden bg-[#1e5128] px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <Reveal className="relative z-10">
            <p className="eyebrow text-[#F4D03F]">For teams & scouts</p>
            <h1 className="mt-6 text-6xl font-black uppercase leading-[.88] tracking-[-.07em] sm:text-8xl">Find the player behind the <span className="text-[#F4D03F]">headline.</span></h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-white/70">A sharper way to widen your funnel, improve your signal, and meet talent before everyone else does.</p>
          </Reveal>
          <Reveal delay={.12} className="relative -mx-5 -mt-4 h-[min(88vw,390px)] sm:h-[440px] lg:mx-0 lg:mt-0 lg:h-[540px]">
            <MotionMedia
              src={teamsHeroImage}
              alt="Athletes competing on the field"
              className="size-full object-cover object-center"
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1e5128] via-transparent to-[#1e5128]/35 lg:bg-gradient-to-r lg:from-[#1e5128] lg:via-[#1e5128]/10 lg:to-transparent" />
          </Reveal>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <Reveal><p className="eyebrow">The scout view</p><h2 className="section-title max-w-2xl">A living shortlist, not a static spreadsheet.</h2></Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <SignalCard number="01" title="Wider funnel" delay={0} artwork={teamIcon}>Reach overlooked athletes with the same confidence as familiar names.</SignalCard>
          <SignalCard number="02" title="Richer signal" delay={0.18} artwork={signalIcon}>See structured testing alongside the context that makes a player click.</SignalCard>
          <SignalCard number="03" title="Better timing" delay={0.36} artwork={timeIcon}>Connect with athletes when the next move is meaningful.</SignalCard>
        </div>
      </section>
      <section className="border-y border-white/10 bg-white/[.03] px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <div><Radar className="text-[#F4D03F]" /><h3 className="mt-4 text-2xl font-black uppercase">Discover</h3><p className="mt-3 leading-7 text-muted-foreground">Filter by position, potential, region, and readiness.</p></div>
          <div><BarChart3 className="text-[#F4D03F]" /><h3 className="mt-4 text-2xl font-black uppercase">Compare</h3><p className="mt-3 leading-7 text-muted-foreground">Review consistent evidence across the network.</p></div>
          <div><Layers3 className="text-[#F4D03F]" /><h3 className="mt-4 text-2xl font-black uppercase">Build</h3><p className="mt-3 leading-7 text-muted-foreground">Create a pipeline that keeps your club ready for tomorrow.</p></div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-2 lg:px-8">
        <Reveal><p className="eyebrow">The invitation</p><h2 className="section-title">Scout with more conviction.</h2><p className="mt-5 leading-7 text-muted-foreground">Demo Day gives ambitious teams a credible new route to the players who are not yet on every list.</p></Reveal>
        <Reveal delay={.1} className="rounded-xl bg-[#e9c46a] p-8 text-[#172219]"><Eye /><h3 className="mt-8 text-3xl font-black uppercase">See the full picture.</h3><p className="mt-3 leading-7">Join the next evaluation cycle and open your club to a deeper pool of possibility.</p><a href="/how-it-works" className="mt-7 inline-flex items-center gap-2 font-bold">Explore the pathway <ArrowRight /></a></Reveal>
      </section>
    </SiteShell>
  )
}
