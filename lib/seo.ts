import type { Metadata } from 'next'

/** Canonical public origin; keep this aligned with the production hostname. */
export const SITE_ORIGIN = 'https://www.demo-day.online'
export const SITE_NAME = 'Demo Day Ghana'
export const SITE_DESCRIPTION =
    'Demo Day is a sports talent discovery platform in Ghana, connecting athletes with teams and verified scouts through structured evaluations.'

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
            images: [{ url: '/logo.webp', alt: 'Demo Day Ghana sports talent discovery platform' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: ['/logo.webp'],
        },
    }
}
