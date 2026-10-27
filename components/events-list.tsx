import { ArrowRight, MapPin } from 'lucide-react'
import type { EventListItem } from '@/lib/supabase/events-data'

/**
 * Server-rendered public calendar list. Events with a cover image use the
 * image layout; the rest fall back to the big date-block card.
 */
export function EventsList({ events }: { events: EventListItem[] }) {
    if (!events.length) {
        return (
            <p className="mt-12 rounded-xl border border-dashed border-foreground/20 p-6 text-sm text-foreground/55">
                No upcoming events have been added yet.
            </p>
        )
    }

    return (
        <div className="mt-12 flex flex-col gap-4">
            {events.map(event => (
                <article key={event.id} className={`group grid overflow-hidden rounded-xl border border-foreground/10 bg-card transition hover:-translate-y-1 hover:border-[#F4D03F] ${event.imageUrl ? 'md:grid-cols-[minmax(280px,.95fr)_1.05fr]' : 'gap-6 p-6 md:grid-cols-[120px_1fr_auto] md:items-center'}`}>
                    {event.imageUrl && <img src={event.imageUrl} alt={`${event.location} venue`} className="h-64 w-full object-cover md:h-full md:min-h-[22rem]" />}
                    <div className={event.imageUrl ? 'p-6 sm:p-8' : ''}>
                        {!event.imageUrl && <div className="text-3xl font-black text-[#1e5128]">{event.dateLabel}</div>}
                        <span className="text-xs font-bold tracking-[.2em] text-[#E67E22]">{event.category.toUpperCase()}</span>
                        {event.isSpotlight && <span className="ml-2 rounded-full bg-[#F4D03F]/30 px-2 py-1 text-[10px] font-black uppercase">Spotlight</span>}
                        <h2 className="mt-2 text-2xl font-black uppercase">{event.title}</h2>
                        {event.description && <p className="mt-2 text-foreground/60">{event.description}</p>}
                        <p className="mt-4 flex items-center gap-2 text-sm font-bold"><MapPin />{event.location} · {event.dateLabel} · {event.timeLabel}</p>
                    </div>
                    {!event.imageUrl && <span className="flex items-center gap-2 font-bold text-[#1e5128]">View details <ArrowRight /></span>}
                </article>
            ))}
        </div>
    )
}
