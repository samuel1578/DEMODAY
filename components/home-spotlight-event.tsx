'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { loadDemoEvents, subscribeToDemoEvents, type DemoEvent } from '@/lib/admin-data'

function formatDate(date: string) {
  if (!date) return 'Date to be announced'
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function HomeSpotlightEvent() {
  const [event, setEvent] = useState<DemoEvent | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const refresh = () => {
      try {
        setEvent(loadDemoEvents().find(item => item.spotlight) ?? null)
        setError('')
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load the spotlight event.')
      }
    }
    refresh()
    return subscribeToDemoEvents(refresh)
  }, [])

  if (!event && !error) return null

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 pt-10 lg:px-8 lg:pt-14 md:static md:z-auto">
      {error ? (
        <p role="alert" className="rounded-lg bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</p>
      ) : event ? (
        <article className={`grid overflow-hidden rounded-2xl bg-[#1e5128] text-white ${event.imageUrl ? 'md:grid-cols-[.95fr_1.05fr]' : 'md:grid-cols-[1fr_auto] md:items-center'}`}>
          {event.imageUrl && <img src={event.imageUrl} alt={`${event.location} venue`} className="h-56 w-full object-cover md:h-full md:min-h-72" />}
          <div className="p-6 sm:p-8">
            <p className="eyebrow text-[#F4D03F]">In the spotlight · {event.category}</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">{event.title}</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/75">{event.description}</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/85">
              <span className="flex items-center gap-2"><CalendarDays size={17} />{formatDate(event.date)} · {event.time}</span>
              <span className="flex items-center gap-2"><MapPin size={17} />{event.location}</span>
            </div>
            <Link href="/events" className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-[#F4D03F] px-5 py-3 font-bold text-[#172219]">
              Explore events <ArrowRight size={18} />
            </Link>
          </div>
        </article>
      ) : null}
    </section>
  )
}
