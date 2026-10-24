import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import { HeroLogo } from '@/components/hero-logo'
import { Reveal } from '@/components/reveal'
import { SiteShell } from '@/components/site-shell'
import { DemoEventsList } from '@/components/demo-events-list'

export default function EventsPage() {
  return (
    <SiteShell current="/events">
      <main className="events-page mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-12">
          <div>
            <p className="eyebrow">The Demo Day calendar</p>
            <h1 className="display-title mt-5 max-w-3xl">Opportunity has a date.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground/60">Scout days, community sessions, and network moments designed to move talent forward.</p>
            <Link href="/admin" className="mt-7 inline-flex items-center gap-2 rounded-md border border-foreground/15 px-5 py-3 font-bold">
              <Plus /> Manage events
            </Link>
          </div>
          <Reveal className="mx-auto w-full max-w-[21rem] lg:max-w-[28rem]">
            <HeroLogo animated />
          </Reveal>
        </section>
        <DemoEventsList />
        <section className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-[#1e5128] p-7 text-white"><CalendarDays className="text-[#F4D03F]" /><h2 className="mt-5 text-2xl font-black uppercase">For athletes</h2><p className="mt-3 text-white/70">Create a profile before you attend so your assessment starts with context.</p></div>
          <div className="rounded-lg border border-foreground/10 p-7"><h2 className="text-2xl font-black uppercase">For scouts</h2><p className="mt-3 text-foreground/60">Save events to your shortlist and meet verified talent in a structured setting.</p></div>
          <div className="rounded-lg border border-foreground/10 p-7"><h2 className="text-2xl font-black uppercase">For guardians</h2><p className="mt-3 text-foreground/60">See where your player is headed and get the information you need to support them.</p></div>
        </section>
      </main>
    </SiteShell>
  )
}
