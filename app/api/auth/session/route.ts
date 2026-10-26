import { getAuthenticatedUser } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return Response.json(
                { authenticated: false },
                { status: 401, headers: { 'Cache-Control': 'private, no-store' } },
            )
        }

        return Response.json(
            { authenticated: true },
            { headers: { 'Cache-Control': 'private, no-store' } },
        )
    } catch {
        return Response.json(
            { error: 'auth_unavailable' },
            { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
        )
    }
}
