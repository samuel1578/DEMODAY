import type { Metadata } from 'next'

/** Canonical public origin; keep this aligned with the production hostname. */
export const SITE_ORIGIN = 'https://www.demo-day.online'
export const SITE_NAME = 'Demo Day Ghana'
export const SITE_DESCRIPTION =
    'Find scout days, community sessions, and athlete evaluation events in Ghana. Verified scouts, safeguarded pathways.'

export function absoluteUrl(path: string): string {
    return new URL(path, SITE_ORIGIN).toString()
}

export function createSeoMetadata({
    title,
    description,
    path,
}: {
    title: string
    description: string
    path: string
}): Metadata {
    const fullTitle = `${title} | ${SITE_NAME}`

    return {
        title,
        description,
        alternates: { canonical: path },
        openGraph: {
            type: 'website',
            locale: 'en_GH',
            siteName: SITE_NAME,
            title: fullTitle,
            description,
            url: path,
            images: [{
                url: '/opengraph-image.png',
                width: 1200,
                height: 630,
                alt: 'Demo Day: Sports scouting in Ghana',
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: ['/twitter-image.png'],
        },
    }
}
