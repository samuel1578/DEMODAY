import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const appUrl = process.env.APP_URL
const issues = []
let parsedUrl
let parsedAppUrl

if (!url) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is missing.')
} else {
    try {
        parsedUrl = new URL(url)
        if (parsedUrl.protocol !== 'https:') {
            issues.push('NEXT_PUBLIC_SUPABASE_URL must use HTTPS for live deployments.')
        }
    } catch {
        issues.push('NEXT_PUBLIC_SUPABASE_URL must be a full HTTPS project URL.')
    }
}

if (!anonKey) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.')
}

if (appUrl?.trim()) {
    try {
        parsedAppUrl = new URL(appUrl)
        const local = ['localhost', '127.0.0.1'].includes(parsedAppUrl.hostname)
        if (parsedAppUrl.protocol !== 'https:' && !(local && parsedAppUrl.protocol === 'http:')) {
            issues.push('APP_URL must use HTTPS except for localhost development.')
        }
        if (parsedAppUrl.username || parsedAppUrl.password || !['', '/'].includes(parsedAppUrl.pathname) || parsedAppUrl.search || parsedAppUrl.hash) {
            issues.push('APP_URL must contain only the canonical application origin.')
        }
    } catch {
        issues.push('APP_URL must be a valid absolute application origin.')
    }
}

if (issues.length > 0) {
    console.error('Supabase environment check failed:')
    for (const issue of issues) console.error(`- ${issue}`)
    process.exitCode = 1
} else {
    console.log('Required Supabase environment variables are configured; values were not printed.')
}

if (process.argv.includes('--network') && issues.length === 0) {
    try {
        const response = await fetch(new URL('/auth/v1/health', parsedUrl), {
            headers: { apikey: anonKey },
            cache: 'no-store',
            signal: AbortSignal.timeout(5_000),
        })

        if (!response.ok) {
            console.error(`Supabase Auth health check failed (HTTP ${response.status}); no response body was logged.`)
            process.exitCode = 1
        } else {
            console.log('Supabase Auth health check succeeded.')
        }
    } catch {
        console.error('Supabase Auth health check could not reach the configured project.')
        process.exitCode = 1
    }
}
