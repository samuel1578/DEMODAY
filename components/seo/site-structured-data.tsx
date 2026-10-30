import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from '@/lib/seo'
import { JsonLd } from './json-ld'

const organizationId = `${SITE_ORIGIN}/#organization`

const siteStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Organization',
            '@id': organizationId,
            name: 'Demo Day',
            alternateName: 'Demo Day Ghana',
            url: SITE_ORIGIN,
            logo: absoluteUrl('/logo.webp'),
            description: SITE_DESCRIPTION,
            areaServed: {
                '@type': 'Country',
                name: 'Ghana',
            },
            knowsAbout: ['sports talent discovery', 'athlete evaluation', 'sports scouting'],
        },
        {
            '@type': 'WebSite',
            '@id': `${SITE_ORIGIN}/#website`,
            url: SITE_ORIGIN,
            name: SITE_NAME,
            inLanguage: 'en-GH',
            publisher: { '@id': organizationId },
        },
    ],
}

export function SiteStructuredData() {
    return <JsonLd data={siteStructuredData} />
}
