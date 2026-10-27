'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, ChartNoAxesColumn, ClipboardList, Plus, Search, Trash2, Users } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { roleFlows } from '@/data/onboarding'
import {
  loadAdminNotes,
  loadDemoEvents,
  roleLabel,
  saveAdminNote,
  saveDemoEvents,
  updateProfileStatus,
  type DemoEvent,
} from '@/lib/admin-data'
import {
  displayName,
  formatValue,
  loadProfiles,
  type FieldDef,
  type ProfileRecord,
  type RoleId,
} from '@/lib/onboarding'

type DashboardTab = 'overview' | 'events' | 'people' | 'analytics'
type RoleFilter = 'all' | RoleId

const initialEvent: Omit<DemoEvent, 'id' | 'createdAt' | 'spotlight'> = {
  title: '',
  description: '',
  category: 'Scout day',
  date: '',
  time: '09:00',
  location: '',
}

function fieldFor(role: RoleId, id: string): FieldDef | undefined {
  return roleFlows[role].steps.flatMap(step => step.fields).find(field => field.id === id)
}

function formatDate(date: string): string {
  if (!date) return 'Date to be announced'
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function summarize(profiles: ProfileRecord[], key: string, role?: RoleId) {
  const counts = new Map<string, number>()
  profiles
    .filter(profile => !role || profile.role === role)
    .forEach(profile => {
      const value = profile.values[key]
      if (value) {
        value.split(',').map(item => item.trim()).filter(Boolean).forEach(item => {
          counts.set(item, (counts.get(item) ?? 0) + 1)
        })
      }
    })
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function Breakdown({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map(([, count]) => count))
  return (
    <section className="rounded-xl border border-foreground/10 bg-card p-5">
      <h3 className="font-black uppercase tracking-wide">{title}</h3>
      {rows.length ? (
        <div className="mt-5 space-y-4">
          {rows.slice(0, 8).map(([label, count]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between gap-4 text-sm">
                <span className="truncate">{label.replaceAll('-', ' ')}</span>
                <span className="font-bold">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                <div className="h-full rounded-full bg-[#1e5128]" style={{ width: `${(count / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : <p className="mt-4 text-sm text-foreground/50">No profile data yet.</p>}
    </section>
  )
}

function TextField({ label, value, onChange, type = 'text', required = true }: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#1e5128]"
      />
    </label>
  )
}

export function AdminDashboard() {
  const [tab, setTab] = useState<DashboardTab>('overview')
  const [profiles, setProfiles] = useState<ProfileRecord[]>([])
  const [events, setEvents] = useState<DemoEvent[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [selectedId, setSelectedId] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [query, setQuery] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [eventDraft, setEventDraft] = useState(initialEvent)
  const [editingEventId, setEditingEventId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    try {
      const currentProfiles = loadProfiles()
      setProfiles(currentProfiles)
      setEvents(loadDemoEvents())
      setNotes(loadAdminNotes())
      setSelectedId(currentProfiles[0]?.id ?? '')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load local demo data.')
    }
  }, [])

  const selectedProfile = profiles.find(profile => profile.id === selectedId) ?? null
  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return profiles.filter(profile => {
      const matchesRole = roleFilter === 'all' || profile.role === roleFilter
      const searchText = `${displayName(profile.role, profile.values)} ${profile.id} ${profile.values.email ?? ''}`.toLowerCase()
      return matchesRole && (!normalizedQuery || searchText.includes(normalizedQuery))
    })
  }, [profiles, query, roleFilter])

  useEffect(() => {
    setNoteDraft(selectedProfile ? notes[selectedProfile.id] ?? '' : '')
  }, [selectedProfile, notes])

  function persistEvents(nextEvents: DemoEvent[]) {
    try {
      saveDemoEvents(nextEvents)
      setEvents(nextEvents)
      setError('')
      setNotice('Event changes saved in this browser.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save events.')
    }
  }

  function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const editing = events.find(item => item.id === editingEventId)
    const item: DemoEvent = {
      ...eventDraft,
      imageUrl: editing?.imageUrl,
      id: editing?.id ?? `event-${Date.now()}`,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      spotlight: editing?.spotlight ?? events.length === 0,
    }
    const nextEvents = editing
      ? events.map(existing => existing.id === item.id ? item : existing)
      : [...events, item]
    persistEvents(nextEvents)
    setEventDraft(initialEvent)
    setEditingEventId('')
  }

  function editEvent(event: DemoEvent) {
    const { title, description, category, date, time, location } = event
    setEventDraft({ title, description, category, date, time, location })
    setEditingEventId(event.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function setSpotlight(eventId: string) {
    persistEvents(events.map(event => ({ ...event, spotlight: event.id === eventId })))
  }

  function removeEvent(eventId: string) {
    if (!window.confirm('Delete this event? This cannot be undone.')) return
    let next = events.filter(event => event.id !== eventId)
    if (!next.some(event => event.spotlight) && next.length) {
      next = next.map((event, index) => index === 0 ? { ...event, spotlight: true } : event)
    }
    persistEvents(next)
  }

  function saveNote() {
    if (!selectedProfile) return
    try {
      saveAdminNote(selectedProfile.id, noteDraft)
      setNotes(loadAdminNotes())
      setError('')
      setNotice('Internal note saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the note.')
    }
  }

  function markReviewed(profile: ProfileRecord) {
    try {
      updateProfileStatus(profile, 'Reviewed', 'Reviewed by Demo Day admin.')
      setProfiles(loadProfiles())
      setError('')
      setNotice(`${displayName(profile.role, profile.values)} marked as reviewed.`)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update this profile.')
    }
  }

  const spotlight = events.find(event => event.spotlight)
  const tabs: { id: DashboardTab; label: string; icon: typeof CalendarDays }[] = [
    { id: 'overview', label: 'Overview', icon: ChartNoAxesColumn },
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'people', label: 'People', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: ClipboardList },
  ]

  return (
    <SiteShell current="/admin">
      <main className="admin-dashboard mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <header className="flex flex-col justify-between gap-5 border-b border-foreground/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Demo Day CEO dashboard</p>
            <h1 className="display-title mt-3">Run the network.</h1>
            <p className="mt-4 max-w-2xl text-foreground/60">Manage events, review role profiles, and understand who the network is reaching.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/reviews" className="w-fit rounded-md bg-[#1e5128] px-5 py-3 font-bold text-white">Profile review &amp; vetting</Link>
            <a href="/events" className="w-fit rounded-md bg-[#F4D03F] px-5 py-3 font-bold text-[#172219]">View public calendar</a>
          </div>
        </header>

        <div className="mt-6 rounded-lg border border-[#E67E22]/30 bg-[#E67E22]/10 p-4 text-sm leading-6">
          Demo data is stored in this browser only. It is not shared across devices and is not secure storage; do not use real sensitive information here.
        </div>
        {error && <p role="alert" className="mt-4 rounded-md bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
        {notice && !error && <p role="status" className="mt-4 rounded-md bg-[#1e5128]/10 p-3 text-sm text-[#1e5128] dark:text-[#F4D03F]">{notice}</p>}

        <div className="mt-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <nav className="flex gap-2 overflow-x-auto border-b border-foreground/10 pb-3 lg:sticky lg:top-28 lg:flex-col lg:items-stretch lg:overflow-visible lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4" aria-label="Dashboard sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setTab(id); setNotice('') }} className={`inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-2.5 text-left text-sm font-bold ${tab === id ? 'bg-[#1e5128] text-white' : 'hover:bg-foreground/5'}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
        {tab === 'overview' && (
          <div className="mt-7">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[['Total profiles', profiles.length], ['Players', profiles.filter(item => item.role === 'player').length], ['Scouts', profiles.filter(item => item.role === 'scout').length], ['Guardians', profiles.filter(item => item.role === 'guardian').length]].map(([label, value]) => (
                <article key={label} className="rounded-xl border border-foreground/10 bg-card p-5">
                  <p className="text-xs uppercase tracking-wider text-foreground/50">{label}</p>
                  <p className="mt-2 text-4xl font-black text-[#1e5128]">{value}</p>
                </article>
              ))}
            </div>
            <section className="mt-5 rounded-xl border border-foreground/10 bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="eyebrow">Homepage spotlight</p><h2 className="mt-2 text-2xl font-black uppercase">{spotlight?.title ?? 'No spotlight event selected'}</h2></div>
                <button onClick={() => setTab('events')} className="rounded-md border border-foreground/15 px-4 py-2 text-sm font-bold">Manage events</button>
              </div>
              {spotlight && <p className="mt-3 text-sm text-foreground/60">{formatDate(spotlight.date)} · {spotlight.time} · {spotlight.location}</p>}
            </section>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <Breakdown title="Player regions" rows={summarize(profiles, 'region', 'player')} />
              <Breakdown title="Player positions" rows={summarize(profiles, 'position', 'player')} />
              <Breakdown title="Scout regions" rows={summarize(profiles, 'region', 'scout')} />
            </div>
          </div>
        )}

        {tab === 'events' && (
          <div className="mt-7 grid items-start gap-6 lg:grid-cols-[.85fr_1.15fr]">
            <form onSubmit={submitEvent} className="rounded-xl border border-foreground/10 bg-card p-5">
              <h2 className="text-xl font-black uppercase">{editingEventId ? 'Edit event' : 'Create event'}</h2>
              <div className="mt-5 grid gap-4">
                <TextField label="Event title" value={eventDraft.title} onChange={title => setEventDraft(draft => ({ ...draft, title }))} />
                <label className="block text-xs font-bold uppercase tracking-wider">Description<textarea required value={eventDraft.description} onChange={event => setEventDraft(draft => ({ ...draft, description: event.target.value }))} rows={3} className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#1e5128]" /></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Category" value={eventDraft.category} onChange={category => setEventDraft(draft => ({ ...draft, category }))} />
                  <TextField label="Date" type="date" value={eventDraft.date} onChange={date => setEventDraft(draft => ({ ...draft, date }))} />
                  <TextField label="Time" type="time" value={eventDraft.time} onChange={time => setEventDraft(draft => ({ ...draft, time }))} />
                  <TextField label="Location" value={eventDraft.location} onChange={location => setEventDraft(draft => ({ ...draft, location }))} />
                </div>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-2 rounded-md bg-[#1e5128] px-4 py-2.5 font-bold text-white"><Plus size={17} />{editingEventId ? 'Save changes' : 'Add event'}</button>
                  {editingEventId && <button type="button" onClick={() => { setEditingEventId(''); setEventDraft(initialEvent) }} className="rounded-md border border-foreground/15 px-4 py-2.5 font-bold">Cancel</button>}
                </div>
              </div>
            </form>
            <section className="space-y-3">
              <h2 className="text-xl font-black uppercase">Calendar · {events.length}</h2>
              {events.map(event => (
                <article key={event.id} className="rounded-xl border border-foreground/10 bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-wider text-[#E67E22]">{event.category}</span>{event.spotlight && <span className="rounded-full bg-[#F4D03F]/30 px-2 py-1 text-[10px] font-black uppercase">Spotlight</span>}</div><h3 className="mt-2 text-xl font-black uppercase">{event.title}</h3></div>
                    <div className="flex gap-2">
                      <button onClick={() => editEvent(event)} className="rounded-md border border-foreground/15 px-3 py-1.5 text-sm font-bold">Edit</button>
                      <button onClick={() => removeEvent(event.id)} aria-label={`Delete ${event.title}`} className="rounded-md border border-red-500/30 p-2 text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-foreground/60">{event.description}</p>
                  <p className="mt-3 text-sm font-semibold">{formatDate(event.date)} · {event.time} · {event.location}</p>
                  <button onClick={() => setSpotlight(event.id)} disabled={event.spotlight} className="mt-4 rounded-md bg-[#1e5128]/10 px-3 py-2 text-xs font-bold text-[#1e5128] disabled:opacity-50 dark:text-[#F4D03F]">Set as homepage spotlight</button>
                </article>
              ))}
              {!events.length && <p className="rounded-xl border border-dashed border-foreground/20 p-6 text-sm text-foreground/60">No events yet. Add one to populate the public events page.</p>}
            </section>
          </div>
        )}

        {tab === 'people' && (
          <div className="mt-7 grid items-start gap-5 lg:grid-cols-[.8fr_1.2fr]">
            <section className="overflow-hidden rounded-xl border border-foreground/10 bg-card">
              <div className="space-y-3 border-b border-foreground/10 p-4">
                <label className="flex items-center gap-2 rounded-md border border-foreground/15 px-3"><Search size={16} className="text-foreground/40" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, email, ID" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" /></label>
                <select value={roleFilter} onChange={event => setRoleFilter(event.target.value as RoleFilter)} className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-sm"><option value="all">All roles</option><option value="player">Players</option><option value="scout">Scouts</option><option value="guardian">Guardians</option></select>
              </div>
              <div className="max-h-[36rem] overflow-y-auto">
                {filteredProfiles.map(profile => (
                  <button key={profile.id} onClick={() => setSelectedId(profile.id)} className={`block w-full border-b border-foreground/10 p-4 text-left ${profile.id === selectedId ? 'bg-[#1e5128]/10' : 'hover:bg-foreground/5'}`}>
                    <span className="flex items-center justify-between gap-3"><strong className="truncate">{displayName(profile.role, profile.values)}</strong><span className="rounded-full bg-foreground/5 px-2 py-1 text-[10px] font-bold uppercase">{roleLabel(profile.role)}</span></span>
                    <span className="mt-1 block truncate text-xs text-foreground/50">{profile.id} · {profile.values.email ?? 'No email'}</span>
                  </button>
                ))}
                {!filteredProfiles.length && <p className="p-5 text-sm text-foreground/50">No profiles match. Profiles appear here after onboarding in this browser.</p>}
              </div>
            </section>
            {selectedProfile ? (
              <section className="space-y-5">
                <div className="rounded-xl border border-foreground/10 bg-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><p className="eyebrow">{roleLabel(selectedProfile.role)} profile</p><h2 className="mt-2 text-2xl font-black uppercase">{displayName(selectedProfile.role, selectedProfile.values)}</h2><p className="mt-2 font-mono text-xs text-foreground/50">{selectedProfile.id}</p></div>
                    <button onClick={() => markReviewed(selectedProfile)} className="rounded-md bg-[#1e5128] px-4 py-2.5 text-sm font-bold text-white">Mark reviewed</button>
                  </div>
                  <p className="mt-4 text-xs text-foreground/50">Onboarded {formatDate(selectedProfile.completedAt.slice(0, 10))} · Status: {selectedProfile.status}</p>
                  <dl className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                    {roleFlows[selectedProfile.role].steps.flatMap(step => step.fields).filter(field => field.type !== 'password' && field.type !== 'photo' && selectedProfile.values[field.id]).map(field => (
                      <div key={field.id} className="min-w-0"><dt className="text-[10px] uppercase tracking-wider text-foreground/45">{field.label}</dt><dd className="mt-1 break-words text-sm font-semibold">{formatValue(field, selectedProfile.values[field.id], selectedProfile.values)}</dd></div>
                    ))}
                  </dl>
                  {selectedProfile.photo && <div className="mt-5"><p className="mb-2 text-[10px] uppercase tracking-wider text-foreground/45">Profile photo</p><img src={selectedProfile.photo} alt="" className="size-20 rounded-lg object-cover" /></div>}
                </div>
                <div className="rounded-xl border border-foreground/10 bg-card p-5">
                  <label className="block text-sm font-black uppercase" htmlFor="internal-note">Internal note <span className="font-normal normal-case text-foreground/50">· only stored in this browser</span></label>
                  <textarea id="internal-note" value={noteDraft} onChange={event => setNoteDraft(event.target.value)} rows={4} placeholder="Add a private review note…" className="mt-3 w-full rounded-md border border-foreground/15 bg-background p-3 text-sm outline-none focus:border-[#1e5128]" />
                  <button onClick={saveNote} className="mt-3 rounded-md bg-[#F4D03F] px-4 py-2.5 text-sm font-bold text-[#172219]">Save internal note</button>
                </div>
              </section>
            ) : <p className="rounded-xl border border-dashed border-foreground/20 p-6 text-sm text-foreground/50">Select a profile to review details and add notes.</p>}
          </div>
        )}

        {tab === 'analytics' && (
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Breakdown title="Players · sport" rows={summarize(profiles, 'sport', 'player')} />
            <Breakdown title="Players · position" rows={summarize(profiles, 'position', 'player')} />
            <Breakdown title="Players · region" rows={summarize(profiles, 'region', 'player')} />
            <Breakdown title="Players · district" rows={summarize(profiles, 'district', 'player')} />
            <Breakdown title="Scouts · region" rows={summarize(profiles, 'region', 'scout')} />
            <Breakdown title="Scouts · regions covered" rows={summarize(profiles, 'regionsSought', 'scout')} />
            <Breakdown title="Scouts · organisation" rows={summarize(profiles, 'organisation', 'scout')} />
            <Breakdown title="Scouts · role" rows={summarize(profiles, 'scoutRole', 'scout')} />
            <Breakdown title="Scouts · affiliation" rows={summarize(profiles, 'affiliationType', 'scout')} />
            <Breakdown title="Scouts · sports" rows={summarize(profiles, 'sports', 'scout')} />
            <Breakdown title="Scouts · age bands" rows={summarize(profiles, 'ageBands', 'scout')} />
            <Breakdown title="Guardians · relationship" rows={summarize(profiles, 'relationship', 'guardian')} />
            <Breakdown title="Guardians · region" rows={summarize(profiles, 'region', 'guardian')} />
            {(['consentParticipation', 'consentMedia', 'consentSafeguarding', 'consentFinancial'] as const).map(key => {
              const guardianProfiles = profiles.filter(profile => profile.role === 'guardian' || (profile.role === 'player' && profile.values.guardianName))
              const yes = guardianProfiles.filter(profile => profile.values[key] === 'yes').length
              const no = guardianProfiles.filter(profile => profile.values[key] === 'no').length
              const title = fieldFor('guardian', key)?.label ?? key
              const consentRows: [string, number][] = []
              if (yes > 0) consentRows.push(['Yes', yes])
              if (no > 0) consentRows.push(['No', no])
              return <Breakdown key={key} title={`Guardian consent · ${title}`} rows={consentRows} />
            })}
          </div>
        )}

        <footer className="mt-10 flex items-center gap-2 border-t border-foreground/10 pt-5 text-xs text-foreground/45">
          <Users size={14} /> {profiles.length} profile{profiles.length === 1 ? '' : 's'} · {events.length} event{events.length === 1 ? '' : 's'} · local browser demo
        </footer>
        </div>
        </div>
      </main>
    </SiteShell>
  )
}
