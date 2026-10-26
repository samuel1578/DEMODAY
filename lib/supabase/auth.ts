import 'server-only'

import type { SupabaseClient, User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createClient } from './server'
import { getAccountOnboardingProgress } from './onboarding-state'

export type AccountRole = 'player' | 'guardian' | 'scout' | 'admin'
export type DashboardRole = Exclude<AccountRole, 'admin'>

/** Returns a user only after Supabase validates the request's access token. */
export async function getAuthenticatedUser(): Promise<User | null> {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()

    if (error) return null
    return data.user
}

/** Redirects unauthenticated requests to the sign-in page. */
export async function requireAuthenticatedUser(): Promise<User> {
    const user = await getAuthenticatedUser()

    if (!user) redirect('/sign-in')
    return user
}

/** Resolve only from the protected database profile, never client/user metadata. */
export async function getAccountDestination(
    user: User,
    client?: SupabaseClient,
): Promise<string> {
    if (!user.email_confirmed_at) return '/account/pending'

    const supabase = client ?? await createClient()
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('user_id', user.id)
        .maybeSingle()

    if (error || !profile) return '/account/pending'

    const role = profile.role as AccountRole
    const status = profile.status as string
    if (role === 'admin') return status === 'active' ? '/admin' : '/account/pending'
    if (!['player', 'guardian', 'scout'].includes(role)) return '/account/pending'
    if (status !== 'approved' && status !== 'active') return '/account/pending'

    const progress = await getAccountOnboardingProgress(user, supabase)
    if (!progress.profileComplete) return '/account/pending'
    if (role === 'scout') {
        const vettingStatus = progress.scoutVettingStatus
        if (vettingStatus !== 'approved' && vettingStatus !== 'active') return '/account/pending'
    }

    return `/${role}`
}

/** Protect dashboard entry against guessed routes, pending accounts, and incomplete profiles. */
export async function requireDashboardAccess(expectedRole: AccountRole): Promise<User> {
    const user = await getAuthenticatedUser()
    if (!user) redirect('/sign-in')
    if (!user.email_confirmed_at) redirect('/account/pending')

    const destination = await getAccountDestination(user)
    if (destination !== `/${expectedRole}`) redirect(destination)
    return user
}
