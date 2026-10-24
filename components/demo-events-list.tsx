'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, MapPin } from 'lucide-react'
import { loadDemoEvents, subscribeToDemoEvents, type DemoEvent } from '@/lib/admin-data'

function displayDate(date: string) {
  if (!date) return 'DATE TBA'
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
  }).toUpperCase()
}

export function DemoEventsList() {
  const [events, setEvents] = useState<DemoEvent[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const refresh = () => {
      try {
        setEvents(loadDemoEvents())
        setError('')
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load events.')
      }
    }
    refresh()
    return subscribeToDemoEvents(refresh)
  }, [])

  return (
    <div className="mt-12 flex flex-col gap-4">
      {error && <p role="alert" className="rounded-lg bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {events.map(event => (
        <article key={event.id} className={`group grid overflow-hidden rounded-xl border border-foreground/10 bg-card transition hover:-translate-y-1 hover:border-[#F4D03F] ${event.imageUrl ? 'md:grid-cols-[minmax(280px,.95fr)_1.05fr]' : 'gap-6 p-6 md:grid-cols-[120px_1fr_auto] md:items-center'}`}>
          {event.imageUrl && <img src={event.imageUrl} alt={`${event.location} venue`} className="h-64 w-full object-cover md:h-full md:min-h-[22rem]" />}
          <div className={event.imageUrl ? 'p-6 sm:p-8' : ''}>
            {!event.imageUrl && <div className="text-3xl font-black text-[#1e5128]">{displayDate(event.date)}</div>}
            <span className="text-xs font-bold tracking-[.2em] text-[#E67E22]">{event.category.toUpperCase()}</span>
            <h2 className="mt-2 text-2xl font-black uppercase">{event.title}</h2>
            <p className="mt-2 text-foreground/60">{event.description}</p>
            <p className="mt-4 flex items-center gap-2 text-sm font-bold"><MapPin />{event.location} · {displayDate(event.date)} · {event.time}</p>
          </div>
          {!event.imageUrl && <span className="flex items-center gap-2 font-bold text-[#1e5128]">View details <ArrowRight /></span>}
        </article>
      ))}
      {!error && !events.length && <p className="rounded-xl border border-dashed border-foreground/20 p-6 text-sm text-foreground/55">No upcoming events have been added yet.</p>}
    </div>
  )
}
