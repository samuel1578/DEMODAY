import 'server-only'

import { resolveDeliveryUrl } from '@/lib/cloudflare/images'
import { createClient } from '@/lib/supabase/server'

/**
 * Server-side event reads. The public site only ever sees published events
 * (enforced by the "Anyone can read published events" RLS policy); the admin
 * reads use the signed-in admin's session, so RLS returns every status.
 */

export interface EventListItem {
    id: string
    title: string
    description: string | null
    category: string
    location: string
    startsAt: string
    dateLabel: string
    longDateLabel: string
    timeLabel: string
    status: 'draft' | 'published' | 'cancelled' | 'completed'
    isSpotlight: boolean
    imageUrl: string | null
    imageObjectKey: string | null
}

interface EventRow {
    id: string
    title: string
    description: string | null
    category: string
    location: string
    starts_at: string
    status: EventListItem['status']
    is_spotlight: boolean
    image_object_key: string | null
}

const eventColumns = 'id, title, description, category, location, starts_at, status, is_spotlight, image_object_key'

function dateLabels(startsAt: string): { dateLabel: string; longDateLabel: string; timeLabel: string } {
    const date = new Date(startsAt)
    return {
        dateLabel: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase(),
        longDateLabel: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        timeLabel: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
    }
}

async function mapRows(rows: EventRow[]): Promise<EventListItem[]> {
    return Promise.all(rows.map(async row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        location: row.location,
        startsAt: row.starts_at,
        ...dateLabels(row.starts_at),
        status: row.status,
        isSpotlight: row.is_spotlight,
        imageUrl: row.image_object_key ? await resolveDeliveryUrl(row.image_object_key, 'public') : null,
        imageObjectKey: row.image_object_key,
    })))
}

/** Published events for the public calendar, soonest first. */
export async function loadPublishedEvents(): Promise<EventListItem[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('events')
        .select(eventColumns)
        .eq('status', 'published')
        .order('starts_at', { ascending: true })
    if (error) throw new Error(`Could not load events: ${error.message}`)
    return mapRows((data ?? []) as EventRow[])
}

/** The single published spotlight event for the homepage, if one is set. */
export async function loadSpotlightEvent(): Promise<EventListItem | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('events')
        .select(eventColumns)
        .eq('status', 'published')
        .eq('is_spotlight', true)
        .maybeSingle()
    if (error) throw new Error(`Could not load the spotlight event: ${error.message}`)
    if (!data) return null
    return (await mapRows([data as EventRow]))[0] ?? null
}

/** Every event for the admin manager; RLS limits non-admin sessions to published. */
export async function loadAllEventsForAdmin(): Promise<EventListItem[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('events')
        .select(eventColumns)
        .order('starts_at', { ascending: true })
    if (error) throw new Error(`Could not load events: ${error.message}`)
    return mapRows((data ?? []) as EventRow[])
}
