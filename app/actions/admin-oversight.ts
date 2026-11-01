'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { deleteImage } from '@/lib/cloudflare/images'
import type { MediaStatus } from '@/lib/supabase/contracts'
import { createClient } from '@/lib/supabase/server'

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
    if (profileError || !profile || profile.role !== 'admin' || profile.status !== 'active') return null
    return supabase
}

function backToMedia(result: string): never {
    redirect(`/admin/media?result=${result}`)
}

function backToGuardians(result: string): never {
    redirect(`/admin/guardians?result=${result}`)
}

export async function updateAdminMediaStatusAction(formData: FormData): Promise<void> {
    const mediaId = formData.get('mediaId')
    const statusValue = formData.get('status')
    if (typeof mediaId !== 'string' || !uuidPattern.test(mediaId)) backToMedia('invalid')
    if (statusValue !== 'approved' && statusValue !== 'rejected') backToMedia('invalid')

    const status = statusValue as Extract<MediaStatus, 'approved' | 'rejected'>
    const supabase = await getActiveAdminClient()
    if (!supabase) backToMedia('denied')

    const { data: media, error: readError } = await supabase
        .from('profile_media')
        .select('id,cloudflare_image_id,visibility,status,is_current,deleted_at')
        .eq('id', mediaId)
        .maybeSingle()
    if (readError || !media) backToMedia('not-found')
    if (!media.is_current || media.deleted_at !== null || media.status === 'rejected') backToMedia('stale')

    // Rejection must stop public/private object delivery, not just change a DB label.
    // The key and bucket visibility are always loaded from the RLS-protected row;
    // the browser never supplies an object key to the signing/deletion service.
    if (status === 'rejected') {
        try {
            await deleteImage(media.cloudflare_image_id, media.visibility)
        } catch {
            backToMedia('storage-failed')
        }
    }

    const { error: statusError } = await supabase.rpc('admin_set_media_status', {
        p_media_id: mediaId,
        p_status: status,
    })
    if (statusError) backToMedia(status === 'rejected' ? 'status-failed-after-removal' : 'failed')

    if (status === 'rejected') {
        const { error: retireError } = await supabase
            .from('profile_media')
            .update({ is_current: false, deleted_at: new Date().toISOString() })
            .eq('id', mediaId)
            .eq('is_current', true)
        if (retireError) backToMedia('retire-failed')
    }

    revalidatePath('/admin/media')
    revalidatePath('/admin/reviews')
    revalidatePath('/admin')
    revalidatePath('/player')
    revalidatePath('/scout')
    revalidatePath('/guardian')
    backToMedia(status === 'rejected' ? 'rejected' : 'approved')
}

export async function updateAdminGuardianLinkAction(formData: FormData): Promise<void> {
    const linkId = formData.get('linkId')
    const status = formData.get('status')
    if (typeof linkId !== 'string' || !uuidPattern.test(linkId)) backToGuardians('invalid')
    if (status !== 'rejected' && status !== 'revoked') backToGuardians('invalid')

    const supabase = await getActiveAdminClient()
    if (!supabase) backToGuardians('denied')

    const { data: link, error: readError } = await supabase
        .from('guardian_player_links')
        .select('id,status')
        .eq('id', linkId)
        .maybeSingle()
    if (readError || !link) backToGuardians('not-found')

    const allowedTransition = (status === 'rejected' && link.status === 'pending')
        || (status === 'revoked' && link.status === 'approved')
    if (!allowedTransition) backToGuardians('stale')

    const { data: updated, error: updateError } = await supabase
        .from('guardian_player_links')
        .update({ status })
        .eq('id', linkId)
        .eq('status', link.status)
        .select('id')
        .maybeSingle()
    if (updateError || !updated) backToGuardians('failed')

    // The existing guardian-link status trigger records this decision in audit_logs.
    revalidatePath('/admin/guardians')
    revalidatePath('/admin')
    revalidatePath('/admin/reviews')
    backToGuardians(status === 'rejected' ? 'rejected' : 'revoked')
}
