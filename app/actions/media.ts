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
import type { MediaActionState, MediaType, MediaVisibility } from '@/lib/supabase/contracts'
import { ownerIsMinor } from '@/lib/supabase/media-data'
import { createClient } from '@/lib/supabase/server'

/**
 * Owner media mutations. The browser uploads bytes straight to R2, so
 * these actions verify the resulting image before any metadata is stored:
 * saves go through the owner-scoped save_owner_media RPC (one transaction,
 * owner forced to auth.uid()), retire stays in RLS with limited column
 * grants, and the guarded admin_set_media_status RPC owns review state.
 */

const uuidPattern = /^[0-9a-f-]{36}$/i
const successPaths = ['/account/onboarding', '/account/pending', '/player', '/scout', '/guardian']

function failure(message: string): MediaActionState {
    return { status: 'error', message }
}

function logMediaFailure(scope: string, error: unknown): void {
    const candidate = error as { code?: string; name?: string; message?: string } | null | undefined
    console.error(`[media] ${scope} failed`, {
        code: candidate?.code ?? null,
        name: candidate?.name ?? null,
        message: candidate?.message ?? 'unknown error',
    })
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

interface SaveOwnerMediaResult {
    media_id: string | null
    retired_object_key: string | null
    retired_visibility: MediaVisibility | null
}

/** Best-effort removal of an object this request created or retired. */
async function discardObject(objectKey: string, visibility: MediaVisibility): Promise<void> {
    try {
        await deleteImage(objectKey, visibility)
    } catch (error) {
        logMediaFailure('discardObject', error)
        // Best effort: the object is unreferenced and never delivered.
    }
}

/**
 * Persists uploaded media. Saving again for the same media type replaces the
 * current image. The retire and insert run in one database transaction
 * (save_owner_media RPC), so a failed insert never retires the previous
 * photo, and failed uploads never leave a registered record behind.
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
    } catch (error) {
        logMediaFailure('getImageDetails', error)
        await discardObject(input.imageId, visibility)
        return failure('The uploaded image could not be verified. Try uploading it again.')
    }
    if (details.contentType !== input.contentType || details.byteSize !== input.byteSize) {
        await discardObject(input.imageId, visibility)
        return failure('The uploaded image did not match its signed type and size. Try uploading it again.')
    }

    const { data, error: saveError } = await supabase.rpc('save_owner_media', {
        p_media_type: mediaType,
        p_object_key: input.imageId,
        p_visibility: visibility,
        p_requires_signed_urls: requiresSignedUrls,
        p_content_type: input.contentType,
        p_byte_size: input.byteSize,
    })
    if (saveError) {
        logMediaFailure('save_owner_media', saveError)
        await discardObject(input.imageId, visibility)
        return failure('The image record could not be saved. Your previous photo is unchanged; try uploading again.')
    }

    const saved = data as SaveOwnerMediaResult | null
    if (!saved?.media_id) {
        await discardObject(input.imageId, visibility)
        return failure('The image record could not be saved. Your previous photo is unchanged; try uploading again.')
    }

    if (saved.retired_object_key && saved.retired_visibility) {
        await discardObject(saved.retired_object_key, saved.retired_visibility)
    }

    revalidateMediaSurfaces()
    return {
        status: 'success',
        message: `${mediaTypeLabels[mediaType]} saved.`,
        mediaId: saved.media_id,
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
        if (retireError) {
            logMediaFailure('retire_media', retireError)
            return failure('The image record could not be retired. Try again.')
        }
    }

    try {
        await deleteImage(row.cloudflare_image_id as string, row.visibility as 'public' | 'private')
    } catch (error) {
        logMediaFailure('deleteImage', error)
        // Best effort: the row is retired even if the provider delete fails.
    }

    revalidateMediaSurfaces()
    return { status: 'success', message: 'Image removed.', deliveryUrl: null }
}
