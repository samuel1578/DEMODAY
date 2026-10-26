import 'server-only'

import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { AccountRole } from './auth'
import { createClient } from './server'

export interface AccountOnboardingProgress {
    role: AccountRole | null
    accountStatus: string | null
    profileComplete: boolean
    scoutVettingStatus: string | null
    under18GuardianApprovalComplete: boolean | null
    missing: string[]
}

type ConsentType = 'participation' | 'media' | 'safeguarding' | 'financial' | 'scout_code' | 'background_check' | 'no_contact_policy'

async function hasCurrentConsents(
    supabase: SupabaseClient,
    subjectUserId: string,
    actorUserId: string,
    requiredTypes: ConsentType[],
): Promise<boolean> {
    const { data, error } = await supabase
        .from('consent_records')
        .select('consent_type,decision,consent_revision')
        .eq('subject_user_id', subjectUserId)
        .eq('actor_user_id', actorUserId)
        .in('consent_type', requiredTypes)
        .order('consent_revision', { ascending: false })

    if (error) return false
    const current = new Map<string, string>()
    for (const record of data ?? []) {
        if (!current.has(record.consent_type)) current.set(record.consent_type, record.decision)
    }
    return requiredTypes.every(type => current.get(type) === 'granted')
}

/** Computes completion only from the authenticated user's persisted Supabase rows. */
export async function getAccountOnboardingProgress(
    user: User,
    client?: SupabaseClient,
): Promise<AccountOnboardingProgress> {
    const supabase = client ?? await createClient()
    const { data: account, error: accountError } = await supabase
        .from('profiles')
        .select('role,status')
        .eq('user_id', user.id)
        .maybeSingle()

    if (accountError || !account) {
        return {
            role: null,
            accountStatus: null,
            profileComplete: false,
            scoutVettingStatus: null,
            under18GuardianApprovalComplete: null,
            missing: ['Account profile'],
        }
    }

    const role = account.role as AccountRole
    const missing: string[] = []
    let profileComplete = false
    let scoutVettingStatus: string | null = null
    let under18GuardianApprovalComplete: boolean | null = null

    if (role === 'player') {
        const [publicResult, privateResult] = await Promise.all([
            supabase.from('player_profiles').select('user_id').eq('user_id', user.id).maybeSingle(),
            supabase.from('player_private_details').select('date_of_birth').eq('user_id', user.id).maybeSingle(),
        ])
        if (publicResult.error || !publicResult.data || privateResult.error || !privateResult.data) {
            missing.push('Player profile and private details')
        } else {
            const birthDate = privateResult.data.date_of_birth
            const cutoff = new Date(`${birthDate}T00:00:00.000Z`)
            cutoff.setUTCFullYear(cutoff.getUTCFullYear() + 18)
            const minor = cutoff.toISOString().slice(0, 10) > new Date().toISOString().slice(0, 10)

            if (minor) {
                const { data, error } = await supabase.rpc('player_guardian_approval_complete')
                under18GuardianApprovalComplete = !error && data === true
                if (!under18GuardianApprovalComplete) missing.push('Approved guardian link and current guardian consents')
            } else if (!(await hasCurrentConsents(supabase, user.id, user.id, ['participation', 'media', 'safeguarding', 'financial']))) {
                missing.push('Current required player consents')
            }
        }
        profileComplete = missing.length === 0
    } else if (role === 'guardian') {
        const { data, error } = await supabase.from('guardian_profiles')
            .select('user_id').eq('user_id', user.id).maybeSingle()
        if (error || !data) missing.push('Guardian profile')
        profileComplete = missing.length === 0
    } else if (role === 'scout') {
        const [profileResult, interestsResult] = await Promise.all([
            supabase.from('scout_profiles').select('vetting_status').eq('user_id', user.id).maybeSingle(),
            supabase.from('scout_interests').select('interest_type').eq('user_id', user.id),
        ])
        if (profileResult.error || !profileResult.data) {
            missing.push('Scout profile')
        } else {
            scoutVettingStatus = profileResult.data.vetting_status
        }
        const interests = interestsResult.error ? [] : interestsResult.data ?? []
        if (!interests.some(item => item.interest_type === 'sport') || !interests.some(item => item.interest_type === 'age_band')) {
            missing.push('Scout sport and age-band interests')
        }
        if (!(await hasCurrentConsents(supabase, user.id, user.id, ['scout_code', 'background_check', 'no_contact_policy']))) {
            missing.push('Current safeguarding consents')
        }
        profileComplete = missing.length === 0
    } else if (role === 'admin') {
        profileComplete = true
    } else {
        missing.push('Supported account role')
    }

    return {
        role,
        accountStatus: account.status,
        profileComplete,
        scoutVettingStatus,
        under18GuardianApprovalComplete,
        missing,
    }
}
