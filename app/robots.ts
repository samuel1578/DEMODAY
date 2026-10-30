import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: '/api/',
            },
            // Allow ChatGPT Search crawling without granting separate model-training access.
            { userAgent: 'OAI-SearchBot', allow: '/', disallow: '/api/' },
            { userAgent: 'GPTBot', disallow: '/' },
            { userAgent: 'Google-Extended', disallow: '/' },
        ],
        sitemap: absoluteUrl('/sitemap.xml'),
    }
}
