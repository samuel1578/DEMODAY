import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveDeliveryUrl } from '@/lib/cloudflare/images'
import { mediaTypeLabels } from '@/lib/media'
import type { MediaStatus, MediaType, MediaVisibility, ProfileMediaRecord } from './contracts'
import { createDemoDayDataContract } from './data-contract'
import { isUnder18 } from './onboarding-validation'

/**
 * Owner-scoped media reads for the signed-in user. Delivery URLs are resolved
 * server-side so a private asset is only ever handed out as a signed URL.
 */

export interface OwnerMedia {
    id: string
    mediaType: MediaType
    label: string
    status: MediaStatus
    visibility: MediaVisibility
    requiresSignedUrls: boolean
    createdAt: string
    deliveryUrl: string | null
}

function isCurrent(record: ProfileMediaRecord): boolean {
    return record.is_current && record.deleted_at === null
}

/**
 * Whether the owner is an under-18 athlete. Unknown status is treated as minor
 * so a photo is stored privately rather than exposed by default.
 */
export async function ownerIsMinor(
    supabase: SupabaseClient,
    userId: string,
    role: string,
): Promise<boolean> {
    if (role !== 'player') return false
    const { data, error } = await supabase
        .from('player_private_details')
        .select('date_of_birth')
        .eq('user_id', userId)
        .maybeSingle()
    if (error || !data?.date_of_birth) return true
    return isUnder18(data.date_of_birth as string)
}

/** Resolves current media rows to deliverable URLs (signed URLs when private). */
export async function resolveOwnerMedia(records: ProfileMediaRecord[]): Promise<OwnerMedia[]> {
    const current = records.filter(isCurrent)
    return Promise.all(current.map(async record => ({
        id: record.id,
        mediaType: record.media_type,
        label: mediaTypeLabels[record.media_type],
        status: record.status,
        visibility: record.visibility,
        requiresSignedUrls: record.requires_signed_urls,
        createdAt: record.created_at,
        deliveryUrl: await resolveDeliveryUrl(record.cloudflare_image_id, record.visibility),
    })))
}

export function profilePhotoUrl(media: OwnerMedia[]): string | null {
    return media.find(item => item.mediaType === 'profile_photo')?.deliveryUrl ?? null
}

export async function loadMyCurrentMedia(): Promise<OwnerMedia[]> {
    const contract = await createDemoDayDataContract()
    return resolveOwnerMedia(await contract.getMyMedia())
}

export async function loadMyCurrentMediaByType(): Promise<Partial<Record<MediaType, OwnerMedia>>> {
    const media = await loadMyCurrentMedia()
    const byType: Partial<Record<MediaType, OwnerMedia>> = {}
    for (const item of media) {
        if (!byType[item.mediaType]) byType[item.mediaType] = item
    }
    return byType
}
