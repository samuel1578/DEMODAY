import type { MediaType, MediaVisibility } from './supabase/contracts'

/** Pure, isomorphic media rules shared by the R2 pipeline and browser. */

export const imageContentTypes = ['image/jpeg', 'image/png', 'image/webp'] as const
export type ImageContentType = (typeof imageContentTypes)[number]

export const maxImageBytes = 10 * 1024 * 1024
export const mediaDeliveryTtlSeconds = 60 * 60
export const mediaUploadTtlSeconds = 30 * 60

export const mediaTypeLabels: Record<MediaType, string> = {
    profile_photo: 'Profile photo',
    action_photo: 'Action photo',
    identity_document: 'Identity document',
}

/** Which media a role may own. Identity documents are scout vetting only. */
const mediaTypesByRole: Record<string, MediaType[]> = {
    player: ['profile_photo', 'action_photo'],
    scout: ['profile_photo', 'identity_document'],
    guardian: ['profile_photo'],
    admin: [],
}

export function mediaTypesForRole(role: string | null | undefined): MediaType[] {
    if (!role) return []
    return mediaTypesByRole[role] ?? []
}

export function isMediaTypeAllowedForRole(role: string | null | undefined, mediaType: string): boolean {
    return mediaTypesForRole(role).includes(mediaType as MediaType)
}

/**
 * Identity documents are always private. Any other media owned by an
 * under-18 athlete is private too, so a minor's photo is never public.
 */
export function mediaVisibilityFor(mediaType: MediaType, ownerIsMinor: boolean): MediaVisibility {
    if (mediaType === 'identity_document') return 'private'
    return ownerIsMinor ? 'private' : 'public'
}

export function requiresSignedUrlsFor(visibility: MediaVisibility): boolean {
    return visibility === 'private'
}

export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB'
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface UploadDeclaration {
    mediaType: MediaType
    contentType: ImageContentType
    byteSize: number
}

export type UploadDeclarationResult =
    | { ok: true; value: UploadDeclaration }
    | { ok: false; message: string }

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Validate untrusted upload metadata before issuing a bounded presigned URL. */
export function parseUploadRequest(body: unknown, role: string | null | undefined): UploadDeclarationResult {
    if (!isRecord(body)) return { ok: false, message: 'A JSON body is required.' }

    const { mediaType, contentType, byteSize } = body
    if (typeof mediaType !== 'string' || !isMediaTypeAllowedForRole(role, mediaType)) {
        return { ok: false, message: 'That media type is not available for your account.' }
    }
    if (typeof contentType !== 'string' || !imageContentTypes.includes(contentType as ImageContentType)) {
        return { ok: false, message: `Upload a ${imageContentTypes.map(type => type.replace('image/', '').toUpperCase()).join(', ')} image.` }
    }
    if (typeof byteSize !== 'number' || !Number.isInteger(byteSize) || byteSize <= 0 || byteSize > maxImageBytes) {
        return { ok: false, message: `Keep images at or under ${formatBytes(maxImageBytes)}.` }
    }

    return {
        ok: true,
        value: {
            mediaType: mediaType as MediaType,
            contentType: contentType as ImageContentType,
            byteSize,
        },
    }
}
