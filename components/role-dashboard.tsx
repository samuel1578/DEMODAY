'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, ChevronRight, CircleAlert, FileText, IdCard, Users } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { roleFlows } from '@/data/onboarding'
import { displayName, formatValue, loadProfile, type FieldDef, type ProfileRecord, type RoleId } from '@/lib/onboarding'

const content = {
  player: {
    label: 'Player',
    title: 'Your pathway, in motion.',
    intro: 'Keep your profile sharp, see upcoming assessments, and understand what scouts see.',
    stats: [['Profile strength', '84%'], ['Assessments', '03'], ['Scout views', '18']],
    cards: ['Complete your bio and highlight reel', 'Book your next Demo Day assessment', 'Review feedback from your last evaluation'],
  },
  scout: {
    label: 'Scout',
    title: 'Find the signal in the noise.',
    intro: 'A focused workspace for discovering verified athletes and building a better shortlist.',
    stats: [['Saved talent', '42'], ['New profiles', '18'], ['Shortlists', '06']],
    cards: ['Review the latest verified profiles', 'Compare your active shortlists', 'Save a new search for your next event'],
  },
  guardian: {
    label: 'Guardian',
    title: 'Stay close to every milestone.',
    intro: 'A clear, calm view of the player journey, upcoming events, and safeguarding resources.',
    stats: [['Player link', '01'], ['Upcoming events', '02'], ['Documents', '05']],
    cards: ['Review the player profile', 'Confirm attendance for Demo Day', 'Open safeguarding resources'],
  },
  admin: {
    label: 'Demo Day CEO',
    title: 'Run the network with intent.',
    intro: 'Manage the calendar, people, and trusted infrastructure behind every fair opportunity.',
    stats: [['Active athletes', '4,280'], ['Upcoming events', '08'], ['Pending reviews', '24']],
    cards: ['Publish a new Scout Day', 'Review role access requests', 'Export network activity'],
  },
}

const summaryFields: Record<string, string[]> = {
  player: ['sport', 'position', 'region', 'district', 'experienceLevel'],
  scout: ['organisation', 'scoutRole', 'affiliationType', 'sports'],
  guardian: ['relationship', 'region', 'athleteId', 'athleteName'],
  admin: [],
}

function findFieldDef(role: keyof typeof content, id: string): FieldDef | undefined {
  const flow = roleFlows[role as 'player' | 'scout' | 'guardian']
  if (!flow) return undefined
  return flow.steps.flatMap(step => step.fields).find(field => field.id === id)
}

function ProfileSummary({ role, record }: { role: keyof typeof content; record: ProfileRecord }) {
  const roleId = role as RoleId
  const fields = summaryFields[role] ?? []
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-xl border border-[#F4D03F]/40 bg-card p-6">
        <div className="flex items-center gap-4">
          {record.photo ? (
            <img src={record.photo} alt={displayName(roleId, record.values)} className="size-16 rounded-full border-2 border-[#F4D03F] object-cover" />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-full bg-[#1e5128] text-[#F4D03F]"><IdCard className="size-7" /></span>
          )}
          <div>
            <p className="eyebrow">Signed in as</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">{displayName(roleId, record.values)}</h2>
            <p className="mt-1 font-mono text-xs tracking-widest text-[#F4D03F]">{record.id}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {fields.filter(id => record.values[id]).map(id => {
            const field = findFieldDef(role, id) ?? { id, label: id, type: 'text' as const }
            return (
              <div key={id}>
                <dt className="text-[10px] uppercase tracking-wider text-foreground/40">{field.label}</dt>
                <dd className="mt-0.5 text-sm font-bold">{formatValue(field, record.values[id], record.values)}</dd>
              </div>
            )
          })}
        </dl>
      </div>
      <div className="rounded-xl border border-foreground/10 bg-card p-6">
        <div className="flex items-center gap-3">
          <CircleAlert className="text-[#E67E22]" />
          <h3 className="text-lg font-black uppercase tracking-tight">{record.status}</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-foreground/60">{record.statusNote}</p>
        <p className="mt-4 text-xs uppercase tracking-wider text-foreground/40">
          Submitted {new Date(record.completedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

export function RoleDashboard({ role }: { role: keyof typeof content }) {
  const data = content[role]
  const [record, setRecord] = useState<ProfileRecord | null>(null)

  useEffect(() => {
    if (role !== 'admin') setRecord(loadProfile(role))
  }, [role])

  return (
    <SiteShell current={role === 'admin' ? '/admin' : `/${role}`}>
      <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="flex flex-col justify-between gap-6 border-b border-foreground/10 pb-10 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">{data.label} dashboard</p>
            <h1 className="display-title mt-4 max-w-3xl">{data.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground/60">{data.intro}</p>
          </div>
          <Link href="/events" className="flex items-center gap-2 rounded-md bg-[#F4D03F] px-5 py-3 font-bold text-[#172219]">
            View events <ChevronRight />
          </Link>
        </div>

        {record ? (
          <ProfileSummary role={role} record={record} />
        ) : role !== 'admin' ? (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-foreground/20 bg-card p-6">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">No {data.label.toLowerCase()} profile yet</h2>
              <p className="mt-1 text-sm text-foreground/60">Complete onboarding to activate this dashboard.</p>
            </div>
            <Link href="/sign-up" className="rounded-md bg-[#F4D03F] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#172219]">
              Start onboarding
            </Link>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {data.stats.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-foreground/10 bg-card p-5">
              <span className="text-xs uppercase tracking-wider text-foreground/50">{label}</span>
              <strong className="mt-2 block text-4xl font-black text-[#1e5128]">{value}</strong>
            </div>
          ))}
        </div>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-xl border border-foreground/10 bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-[#1e5128]" />
              <h2 className="text-2xl font-black uppercase">Your action board</h2>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              {data.cards.map((card, index) => (
                <div key={card} className="flex items-center justify-between rounded-md border border-foreground/10 p-4">
                  <span className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#F4D03F]">0{index + 1}</span>
                    {card}
                  </span>
                  <ChevronRight className="text-foreground/40" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-[#1e5128] p-6 text-white sm:p-8">
            <p className="eyebrow">Next up</p>
            <h2 className="mt-4 text-3xl font-black uppercase">Accra North Scout Day</h2>
            <p className="mt-4 text-white/70">Saturday, 18 May · 09:00 · Demo Day Campus</p>
            <Link href="/events" className="mt-8 flex w-fit items-center gap-2 rounded-md bg-[#F4D03F] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#172219]">
              See full calendar <CalendarDays />
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-foreground/10 p-5">
            <Users className="text-[#1e5128]" />
            <h3 className="mt-4 font-bold">People & access</h3>
            <p className="mt-2 text-sm text-foreground/60">Role-based information stays clear and private.</p>
          </div>
          <div className="rounded-lg border border-foreground/10 p-5">
            <FileText className="text-[#1e5128]" />
            <h3 className="mt-4 font-bold">Records & notes</h3>
            <p className="mt-2 text-sm text-foreground/60">Keep every decision connected to evidence.</p>
          </div>
          <div className="rounded-lg border border-foreground/10 p-5">
            <CalendarDays className="text-[#1e5128]" />
            <h3 className="mt-4 font-bold">Calendar</h3>
            <p className="mt-2 text-sm text-foreground/60">Stay ahead of the next opportunity.</p>
          </div>
        </section>
      </main>
    </SiteShell>
  )
}
