'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { deleteImage, getImageDetails, resolveDeliveryUrl } from '@/lib/cloudflare/images'
import {
    imageContentTypes,
    isMediaTypeAllowedForRole,
    maxImageBytes,
    mediaTypeLabels,
    mediaVisibilityFor,
    requiresSignedUrlsFor,
    type ImageContentType,
} from '@/lib/media'
import type { MediaActionState, MediaType } from '@/lib/supabase/contracts'
import { ownerIsMinor } from '@/lib/supabase/media-data'
import { createClient } from '@/lib/supabase/server'

/**
 * Owner media mutations. The browser uploads bytes straight to R2, so
 * these actions verify the resulting image before any metadata is stored:
 * authorization stays in RLS (owner-scoped reads/updates plus limited column
 * grants), and the guarded `admin_set_media_status` RPC owns review state.
 */

const uuidPattern = /^[0-9a-f-]{36}$/i
const successPaths = ['/account/onboarding', '/account/pending', '/player', '/scout', '/guardian']

function failure(message: string): MediaActionState {
    return { status: 'error', message }
}

async function getOwnerContext(): Promise<{ supabase: SupabaseClient; userId: string; role: string } | null> {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) return null

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', authData.user.id)
        .maybeSingle()
    if (profileError || !profile) return null

    return { supabase, userId: authData.user.id, role: profile.role as string }
}

function revalidateMediaSurfaces() {
    for (const path of successPaths) revalidatePath(path)
}

/**
 * Persists uploaded media. Saving again for the same media type replaces the
 * current image: the previous row is retired and its R2 object removed.
 */
export async function saveMediaAction(input: {
    mediaType: string
    imageId: string
    contentType: string
    byteSize: number
}): Promise<MediaActionState> {
    const context = await getOwnerContext()
    if (!context) return failure('Sign in before saving media.')

    const { supabase, userId, role } = context
    if (!isMediaTypeAllowedForRole(role, input.mediaType)) {
        return failure('That media type is not available for your account.')
    }
    const expectedKeyPrefix = `media/${userId}/`
    const keyName = input.imageId.startsWith(expectedKeyPrefix) ? input.imageId.slice(expectedKeyPrefix.length) : ''
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(keyName)) {
        return failure('That image reference is not valid.')
    }
    if (!imageContentTypes.includes(input.contentType as ImageContentType)) {
        return failure('Only JPEG, PNG, and WebP images are supported.')
    }
    if (!Number.isInteger(input.byteSize) || input.byteSize <= 0 || input.byteSize > maxImageBytes) {
        return failure('That image size is not supported.')
    }

    const mediaType = input.mediaType as MediaType
    const visibility = mediaVisibilityFor(mediaType, await ownerIsMinor(supabase, userId, role))
    const requiresSignedUrls = requiresSignedUrlsFor(visibility)

    let details
    try {
        details = await getImageDetails(input.imageId, visibility)
    } catch {
        return failure('The uploaded image could not be verified. Try uploading it again.')
    }
    if (details.contentType !== input.contentType || details.byteSize !== input.byteSize) {
        return failure('The uploaded image did not match its signed type and size. Try uploading it again.')
    }

    const { data: existing, error: existingError } = await supabase
        .from('profile_media')
        .select('id,cloudflare_image_id,visibility')
        .eq('owner_user_id', userId)
        .eq('media_type', mediaType)
        .eq('is_current', true)
        .is('deleted_at', null)
        .maybeSingle()
    if (existingError) return failure('The current image could not be read. Try again.')

    if (existing) {
        const { error: retireError } = await supabase
            .from('profile_media')
            .update({ is_current: false, deleted_at: new Date().toISOString() })
            .eq('id', existing.id)
            .eq('owner_user_id', userId)
        if (retireError) return failure('The previous image could not be retired. Try again.')
    }

    const { data: inserted, error: insertError } = await supabase
        .from('profile_media')
        .insert({
            owner_user_id: userId,
            media_type: mediaType,
            cloudflare_image_id: input.imageId,
            visibility,
            requires_signed_urls: requiresSignedUrls,
            content_type: input.contentType,
            byte_size: input.byteSize,
            is_current: true,
        })
        .select('id')
        .single()
    if (insertError || !inserted) {
        return failure('The image record could not be saved. The previous image was retired; upload again to restore one.')
    }

    if (existing && typeof existing.cloudflare_image_id === 'string') {
        try {
            await deleteImage(existing.cloudflare_image_id, existing.visibility as 'public' | 'private')
        } catch {
            // Best effort: the replaced asset is already unreferenced in the app.
        }
    }

    revalidateMediaSurfaces()
    return {
        status: 'success',
        message: `${mediaTypeLabels[mediaType]} saved.`,
        mediaId: inserted.id as string,
        deliveryUrl: await resolveDeliveryUrl(input.imageId, visibility),
    }
}

/** Retires the current media row and deletes its R2 object. */
export async function deleteMediaAction(input: { mediaId: string }): Promise<MediaActionState> {
    const context = await getOwnerContext()
    if (!context) return failure('Sign in before removing media.')
    if (!uuidPattern.test(input.mediaId)) return failure('That media record is not valid.')

    const { supabase, userId } = context
    const { data: row, error } = await supabase
        .from('profile_media')
        .select('id,cloudflare_image_id,is_current,visibility')
        .eq('id', input.mediaId)
        .eq('owner_user_id', userId)
        .maybeSingle()
    if (error || !row) return failure('That media record was not found.')

    if (row.is_current) {
        const { error: retireError } = await supabase
            .from('profile_media')
            .update({ is_current: false, deleted_at: new Date().toISOString() })
            .eq('id', row.id)
            .eq('owner_user_id', userId)
        if (retireError) return failure('The image record could not be retired. Try again.')
    }

    try {
        await deleteImage(row.cloudflare_image_id as string, row.visibility as 'public' | 'private')
    } catch {
        // Best effort: the row is retired even if the provider delete fails.
    }

    revalidateMediaSurfaces()
    return { status: 'success', message: 'Image removed.', deliveryUrl: null }
}
