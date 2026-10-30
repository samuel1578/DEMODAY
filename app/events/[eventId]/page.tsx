import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, MapPin } from 'lucide-react'
import { JsonLd } from '@/components/seo/json-ld'
import { SiteShell } from '@/components/site-shell'
import { createSeoMetadata, absoluteUrl } from '@/lib/seo'
import { loadPublishedEventById } from '@/lib/supabase/events-data'
import type { Metadata } from 'next'

type EventPageProps = {
    params: Promise<{ eventId: string }>
}

async function getEvent(eventId: string) {
    try {
        return await loadPublishedEventById(eventId)
    } catch {
        return null
    }
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
    const { eventId } = await params
    const event = await getEvent(eventId)

    if (!event) {
        return {
            title: 'Event not found',
            robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
        }
    }

    return createSeoMetadata({
        title: `${event.title} in Ghana`,
        description: event.description || `${event.title}: a Demo Day sports talent event in Ghana at ${event.location} on ${event.longDateLabel}.`,
        path: `/events/${encodeURIComponent(event.id)}`,
    })
}

export default async function EventDetailPage({ params }: EventPageProps) {
    const { eventId } = await params
    const event = await getEvent(eventId)
    if (!event) notFound()

    const eventStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: event.title,
        description: event.description || undefined,
        startDate: event.startsAt,
        sport: event.category,
        location: {
            '@type': 'Place',
            name: event.location,
        },
        organizer: {
            '@type': 'Organization',
            name: 'Demo Day',
            url: absoluteUrl('/'),
        },
        image: event.imageUrl ? [event.imageUrl] : undefined,
        url: absoluteUrl(`/events/${encodeURIComponent(event.id)}`),
    }

    return (
        <SiteShell current="/events">
            <article className="mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-20">
                <JsonLd data={eventStructuredData} />
                <Link href="/events" className="font-bold text-[#1e5128] underline underline-offset-4">
                    All Demo Day events
                </Link>
                <p className="eyebrow mt-10">{event.category} · Sports event in Ghana</p>
                <h1 className="display-title mt-4 max-w-4xl">{event.title}</h1>
                {event.description && <p className="mt-6 max-w-3xl text-lg leading-8 text-foreground/65">{event.description}</p>}
                <div className="mt-8 grid gap-4 rounded-xl border border-foreground/10 p-6 sm:grid-cols-2">
                    <p className="flex items-start gap-3 font-semibold">
                        <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-[#1e5128]" />
                        <span>{event.location}</span>
                    </p>
                    <p className="flex items-start gap-3 font-semibold">
                        <CalendarDays aria-hidden="true" className="mt-1 size-5 shrink-0 text-[#1e5128]" />
                        <time dateTime={event.startsAt}>{event.longDateLabel} · {event.timeLabel}</time>
                    </p>
                </div>
                {event.imageUrl && (
                    <img src={event.imageUrl} alt={`${event.title} event`} className="mt-10 max-h-[32rem] w-full rounded-xl object-cover" />
                )}
                <section className="mt-12 rounded-xl bg-[#1e5128] p-8 text-white">
                    <h2 className="text-2xl font-black uppercase">Take the next step</h2>
                    <p className="mt-3 max-w-2xl leading-7 text-white/75">Athletes can create a profile before attending. Scouts must complete verification before platform or event access.</p>
                    <Link href="/sign-up" className="mt-6 inline-flex rounded-md bg-[#F4D03F] px-5 py-3 font-bold text-[#172219]">
                        Join the Demo Day pathway
                    </Link>
                </section>
            </article>
        </SiteShell>
    )
}
