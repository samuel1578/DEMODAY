import { CalendarDays, MapPin } from 'lucide-react'
import type { EventListItem } from '@/lib/supabase/events-data'

const eventArtwork = [
    { src: '/icons/sports.svg', name: 'Sports' },
    { src: '/icons/team.svg', name: 'Teamwork' },
] as const

/** Server-rendered public calendar cards, with varied artwork from public/icons. */
export function EventsList({ events }: { events: EventListItem[] }) {
    if (!events.length) {
        return (
            <p className="mt-12 rounded-xl border border-dashed border-foreground/20 p-6 text-sm text-foreground/55">
                No upcoming events have been added yet.
            </p>
        )
    }

    return (
        <div className="mt-12 flex flex-col gap-5">
            {events.map((event, index) => {
                const artwork = eventArtwork[index % eventArtwork.length]

                return (
                    <article key={event.id} className="group grid overflow-hidden rounded-2xl border border-foreground/10 bg-card transition duration-300 hover:-translate-y-1 hover:border-[#F4D03F]/70 hover:shadow-xl md:grid-cols-[minmax(17rem,.8fr)_1.2fr]">
                        <div className="relative isolate flex min-h-64 items-end overflow-hidden bg-[#10251a] p-6 sm:p-8 md:min-h-[19rem]">
                            {event.imageUrl ? (
                                <img src={event.imageUrl} alt={`${event.location} venue`} className="absolute inset-0 -z-20 size-full object-cover transition duration-500 group-hover:scale-105" />
                            ) : (
                                <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_40%,rgba(244,208,63,.2),transparent_38%),linear-gradient(135deg,#1e5128,#10251a)]" />
                            )}
                            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#08130d]/95 via-[#08130d]/25 to-[#08130d]/10" />
                            <div aria-hidden="true" className="absolute inset-4 -z-10 rounded-xl border border-white/15" />
                            <div className="flex items-end gap-4">
                                <img src={artwork.src} alt="" aria-hidden="true" className="size-24 object-contain brightness-0 invert sm:size-28" />
                                <div className="pb-2 text-white">
                                    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#F4D03F]">Event focus</p>
                                    <p className="mt-1 text-lg font-black uppercase tracking-wide">{artwork.name}</p>
                                </div>
                            </div>
                            <span className="absolute right-7 top-7 rounded-full border border-white/25 bg-black/25 px-3 py-1.5 text-xs font-bold tracking-wide text-white backdrop-blur-sm">
                                {event.dateLabel}
                            </span>
                        </div>

                        <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 md:p-10">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-xs font-bold uppercase tracking-[.2em] text-[#E67E22]">{event.category}</span>
                                {event.isSpotlight && <span className="rounded-full bg-[#F4D03F]/25 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide">Spotlight</span>}
                            </div>
                            <h2 className="mt-3 max-w-3xl break-words text-2xl font-black uppercase leading-tight sm:text-3xl">{event.title}</h2>
                            {event.description && <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/65">{event.description}</p>}
                            <div className="mt-6 flex flex-col gap-3 border-t border-foreground/10 pt-5 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
                                <p className="flex min-w-0 items-start gap-2 font-semibold">
                                    <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#1e5128]" />
                                    <span className="break-words">{event.location}</span>
                                </p>
                                <p className="flex items-center gap-2 font-semibold">
                                    <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-[#1e5128]" />
                                    <span>{event.longDateLabel} <span className="text-foreground/45">·</span> {event.timeLabel}</span>
                                </p>
                            </div>
                        </div>
                    </article>
                )
            })}
        </div>
    )
}
