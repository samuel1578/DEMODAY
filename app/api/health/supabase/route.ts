import { getSupabaseEnv } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

export async function GET() {
    let config: ReturnType<typeof getSupabaseEnv>

    try {
        config = getSupabaseEnv()
    } catch {
        return Response.json(
            { status: 'not_configured', service: 'supabase' },
            { status: 503 },
        )
    }

    try {
        const response = await fetch(
            new URL('/auth/v1/health', config.url),
            {
                headers: { apikey: config.anonKey },
                cache: 'no-store',
                signal: AbortSignal.timeout(5_000),
            },
        )

        if (!response.ok) {
            return Response.json(
                { status: 'unavailable', service: 'supabase' },
                { status: 503 },
            )
        }

        return Response.json({ status: 'ok', service: 'supabase' })
    } catch {
        return Response.json(
            { status: 'unavailable', service: 'supabase' },
            { status: 503 },
        )
    }
}
