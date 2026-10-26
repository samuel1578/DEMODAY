const missingSupabaseEnvMessage =
    'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'

export function getSupabaseEnv() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
        throw new Error(missingSupabaseEnvMessage)
    }

    return { url, anonKey }
}

/** Canonical origin for optional email-link/OAuth callbacks; never derive it from an untrusted Host header. */
export function getAppOrigin(): string {
    const value = process.env.APP_URL?.trim()
    if (!value) throw new Error('APP_URL is required for email-link or OAuth callbacks.')

    let url: URL
    try {
        url = new URL(value)
    } catch {
        throw new Error('APP_URL must be a valid absolute application URL.')
    }

    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (url.protocol !== 'https:' && !(isLocalhost && url.protocol === 'http:')) {
        throw new Error('APP_URL must use HTTPS, except for local localhost development.')
    }
    if (url.username || url.password || (url.pathname !== '/' && url.pathname !== '') || url.search || url.hash) {
        throw new Error('APP_URL must contain only the canonical application origin.')
    }

    return url.origin
}
