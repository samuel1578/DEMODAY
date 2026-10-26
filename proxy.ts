import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Keep the prototype usable before environment values are configured.
    if (!url || !anonKey) return NextResponse.next({ request })

    let response = NextResponse.next({ request })
    const supabase = createServerClient(url, anonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet, headers) {
                for (const { name, value } of cookiesToSet) {
                    request.cookies.set(name, value)
                }

                response = NextResponse.next({ request })

                for (const { name, value, options } of cookiesToSet) {
                    response.cookies.set(name, value, options)
                }

                for (const [name, value] of Object.entries(headers)) {
                    response.headers.set(name, value)
                }
            },
        },
    })

    // Validate the cookie-backed user and refresh expired tokens before rendering.
    await supabase.auth.getUser()

    return response
}

export const config = {
    matcher: [
        '/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
