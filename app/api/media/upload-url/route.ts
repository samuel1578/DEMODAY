import { NextResponse } from 'next/server'
import { createDirectUpload, createEventImageUpload, isR2Configured } from '@/lib/cloudflare/images'
import { imageContentTypes, maxImageBytes, mediaVisibilityFor, parseUploadRequest } from '@/lib/media'
import { ownerIsMinor } from '@/lib/supabase/media-data'
import { createClient } from '@/lib/supabase/server'

/**
 * Issues a 30-minute R2 PutObject URL. The browser uploads directly to R2;
 * the S3 credentials remain server-only.
 */

const noStoreHeaders = { 'Cache-Control': 'private, no-store' } as const

function json(body: unknown, status: number) {
    return NextResponse.json(body, { status, headers: noStoreHeaders })
}

export async function POST(request: Request) {
    if (!isR2Configured()) {
        return json({ error: 'Media uploads are not configured on this deployment.' }, 503)
    }

    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
        return json({ error: 'Sign in to upload media.' }, 401)
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', authData.user.id)
        .maybeSingle()
    if (profileError || !profile) {
        return json({ error: 'A saved account profile is required before uploading media.' }, 403)
    }

    let body: unknown = null
    try {
        body = await request.json()
    } catch {
        body = null
    }

    if (body && typeof body === 'object' && 'kind' in body && (body as { kind?: unknown }).kind === 'event') {
        if (profile.role !== 'admin') {
            return json({ error: 'Only administrators can upload event images.' }, 403)
        }
        const contentType = (body as { contentType?: unknown }).contentType
        const byteSize = (body as { byteSize?: unknown }).byteSize
        if (typeof contentType !== 'string' || !(imageContentTypes as readonly string[]).includes(contentType)) {
            return json({ error: 'Only JPEG, PNG, and WebP images are supported.' }, 400)
        }
        if (!Number.isInteger(byteSize) || (byteSize as number) <= 0 || (byteSize as number) > maxImageBytes) {
            return json({ error: 'That image size is not supported.' }, 400)
        }
        try {
            const upload = await createEventImageUpload({
                contentType: contentType as (typeof imageContentTypes)[number],
                byteSize: byteSize as number,
            })
            return json({
                imageId: upload.imageId,
                uploadUrl: upload.uploadUrl,
                visibility: 'public',
                requiresSignedUrls: false,
            }, 200)
        } catch {
            console.error('Failed to issue R2 event image upload URL.')
            return json({ error: 'The media service could not issue an upload URL. Try again.' }, 502)
        }
    }

    const parsed = parseUploadRequest(body, profile.role as string)
    if (!parsed.ok) {
        return json({ error: parsed.message }, 400)
    }

    const minor = await ownerIsMinor(supabase, authData.user.id, profile.role as string)
    const visibility = mediaVisibilityFor(parsed.value.mediaType, minor)

    try {
        const upload = await createDirectUpload({
            visibility,
            ownerUserId: authData.user.id,
            contentType: parsed.value.contentType,
            byteSize: parsed.value.byteSize,
        })
        return json({
            imageId: upload.imageId,
            uploadUrl: upload.uploadUrl,
            visibility,
            requiresSignedUrls: visibility === 'private',
        }, 200)
    } catch {
        console.error('Failed to issue R2 media upload URL.')
        return json({ error: 'The media service could not issue an upload URL. Try again.' }, 502)
    }
}
