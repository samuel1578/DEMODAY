import type { MetadataRoute } from 'next'
import { loadPublishedEventIds } from '@/lib/supabase/events-data'
import { absoluteUrl } from '@/lib/seo'

const publicRoutes = [
    '/',
    '/how-it-works',
    '/safeguarding',
    '/teams',
    '/scouts',
    '/events',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const pages: MetadataRoute.Sitemap = publicRoutes.map(path => ({
        url: absoluteUrl(path),
    }))

    try {
        const eventIds = await loadPublishedEventIds()
        pages.push(...eventIds.map(eventId => ({
            url: absoluteUrl(`/events/${encodeURIComponent(eventId)}`),
        })))
    } catch {
        // Keep the public marketing URLs discoverable if event storage is unavailable.
    }

    return pages
}
