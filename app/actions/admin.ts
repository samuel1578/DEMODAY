'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ProfileStatus } from '@/lib/supabase/contracts'
import { createClient } from '@/lib/supabase/server'

/**
 * Server-backed admin review actions. Authorization is enforced by the
 * database RPCs (`private.is_active_admin()`), not by this server code: the
 * checks here only fail fast before the request reaches the database.
 */

const profileStatuses: ProfileStatus[] = ['pending', 'approved', 'rejected', 'reviewed', 'active']
const uuidPattern = /^[0-9a-f-]{36}$/i

async function getActiveAdminClient() {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) return null

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role,status')
        .eq('user_id', authData.user.id)
        .maybeSingle()
    if (profileError || !profile) return null
    if (profile.role !== 'admin' || profile.status !== 'active') return null
    return supabase
}

function backToReviews(result: string): never {
    redirect(`/admin/reviews?result=${result}`)
}

async function readReviewTarget(formData: FormData): Promise<{ userId: string; status: ProfileStatus }> {
    const userId = formData.get('userId')
    const status = formData.get('status')
    if (typeof userId !== 'string' || !uuidPattern.test(userId)) backToReviews('invalid')
    if (typeof status !== 'string' || !profileStatuses.includes(status as ProfileStatus)) backToReviews('invalid')
    return { userId, status: status as ProfileStatus }
}

export async function updateProfileStatusAction(formData: FormData): Promise<void> {
    const { userId, status } = await readReviewTarget(formData)
    const supabase = await getActiveAdminClient()
    if (!supabase) backToReviews('denied')

    const { error } = await supabase.rpc('admin_set_profile_status', {
        p_user_id: userId,
        p_status: status,
    })
    if (error) backToReviews('failed')

    revalidatePath('/admin/reviews')
    revalidatePath('/admin')
    backToReviews('updated')
}

export async function updateScoutVettingStatusAction(formData: FormData): Promise<void> {
    const { userId, status } = await readReviewTarget(formData)
    const supabase = await getActiveAdminClient()
    if (!supabase) backToReviews('denied')

    const { error } = await supabase.rpc('admin_set_scout_vetting_status', {
        p_scout_user_id: userId,
        p_status: status,
    })
    if (error) backToReviews('failed')

    revalidatePath('/admin/reviews')
    revalidatePath('/admin')
    backToReviews('updated')
}
