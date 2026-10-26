import { NextResponse, type NextRequest } from 'next/server'
import { getAccountDestination } from '@/lib/supabase/auth'
import { getAppOrigin } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

function redirectFromCanonicalOrigin(path: string, origin: string): NextResponse {
    const response = NextResponse.redirect(new URL(path, origin))
    response.headers.set('Cache-Control', 'private, no-store')
    return response
}

export async function GET(request: NextRequest) {
    const origin = getAppOrigin()
    const supabase = await createClient()
    const code = request.nextUrl.searchParams.get('code')

    if (!code) return redirectFromCanonicalOrigin('/auth/error', origin)

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return redirectFromCanonicalOrigin('/auth/error', origin)

    const { data, error: userError } = await supabase.auth.getUser()
    if (userError || !data.user || !data.user.email_confirmed_at) {
        await supabase.auth.signOut()
        return redirectFromCanonicalOrigin('/auth/error', origin)
    }

    const destination = await getAccountDestination(data.user, supabase)
    return redirectFromCanonicalOrigin(destination, origin)
}
