import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from './env'

export async function createClient() {
    const cookieStore = await cookies()
    const { url, anonKey } = getSupabaseEnv()

    return createServerClient(url, anonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    for (const { name, value, options } of cookiesToSet) {
                        cookieStore.set(name, value, options)
                    }
                } catch {
                    // Server Components cannot write cookies. A Route Handler or Server Action
                    // can persist refreshed cookies when it handles an auth-changing request.
                }
            },
        },
    })
}
