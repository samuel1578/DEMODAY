import 'server-only'

import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { mediaDeliveryTtlSeconds, mediaUploadTtlSeconds, type ImageContentType } from '@/lib/media'
import type { MediaVisibility } from '@/lib/supabase/contracts'

/**
 * R2 S3-compatible storage adapter. The public and private buckets must remain
 * separate: enabling public bucket access would expose every object in it.
 */

export interface R2Env {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucketName: string
    privateBucketName: string
    publicDomain: string | null
}

function read(value: string | undefined): string | null {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

export function getR2Env(): R2Env | null {
    const accountId = read(process.env.R2_ACCOUNT_ID)
    const accessKeyId = read(process.env.R2_ACCESS_KEY_ID)
    const secretAccessKey = read(process.env.R2_SECRET_ACCESS_KEY)
    const bucketName = read(process.env.R2_BUCKET_NAME)
    const privateBucketName = read(process.env.R2_PRIVATE_BUCKET_NAME)
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !privateBucketName) return null

    return {
        accountId,
        accessKeyId,
        secretAccessKey,
        bucketName,
        privateBucketName,
        publicDomain: read(process.env.R2_PUBLIC_CUSTOM_DOMAIN),
    }
}

export function isR2Configured(): boolean {
    return getR2Env() !== null
}

function requireEnv(): R2Env {
    const env = getR2Env()
    if (!env) {
        throw new Error(
            'R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PRIVATE_BUCKET_NAME.',
        )
    }
    return env
}

let client: S3Client | null = null

function getClient(env: R2Env): S3Client {
    if (!client) {
        client = new S3Client({
            region: 'auto',
            endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
            forcePathStyle: true,
            credentials: {
                accessKeyId: env.accessKeyId,
                secretAccessKey: env.secretAccessKey,
            },
        })
    }
    return client
}

function bucketFor(env: R2Env, visibility: MediaVisibility): string {
    return visibility === 'public' ? env.bucketName : env.privateBucketName
}

function extensionFor(contentType: ImageContentType): string {
    switch (contentType) {
        case 'image/jpeg': return 'jpg'
        case 'image/png': return 'png'
        case 'image/webp': return 'webp'
    }
}

function requirePublicDomain(value: string | null): URL | null {
    if (!value) return null
    const url = new URL(value.includes('://') ? value : `https://${value}`)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
        throw new Error('R2_PUBLIC_CUSTOM_DOMAIN must be an HTTPS origin without credentials, query, or fragment.')
    }
    return url
}

function publicObjectUrl(domain: URL, objectKey: string): string {
    const encodedKey = objectKey.split('/').map(segment => encodeURIComponent(segment)).join('/')
    return `${domain.origin}${domain.pathname.replace(/\/+$/, '')}/${encodedKey}`
}

export interface DirectUploadResult {
    /** The R2 object key persisted as public.profile_media.cloudflare_image_id. */
    imageId: string
    uploadUrl: string
}

/** Issue a 30-minute presigned PUT URL bound to an exact type and byte length. */
export async function createDirectUpload(input: {
    visibility: MediaVisibility
    ownerUserId: string
    contentType: ImageContentType
    byteSize: number
}): Promise<DirectUploadResult> {
    const env = requireEnv()
    const objectKey = `media/${input.ownerUserId}/${crypto.randomUUID()}.${extensionFor(input.contentType)}`
    const uploadUrl = await getSignedUrl(
        getClient(env),
        new PutObjectCommand({
            Bucket: bucketFor(env, input.visibility),
            Key: objectKey,
            ContentType: input.contentType,
            ContentLength: input.byteSize,
        }),
        {
            expiresIn: mediaUploadTtlSeconds,
            signableHeaders: new Set(['content-type']),
        },
    )
    return { imageId: objectKey, uploadUrl }
}

/** Issue a 30-minute presigned PUT URL for a public event cover image. */
export async function createEventImageUpload(input: {
  contentType: ImageContentType
  byteSize: number
}): Promise<DirectUploadResult> {
  const env = requireEnv()
  const objectKey = `events/${crypto.randomUUID()}.${extensionFor(input.contentType)}`
  const uploadUrl = await getSignedUrl(
    getClient(env),
    new PutObjectCommand({
      Bucket: env.bucketName,
      Key: objectKey,
      ContentType: input.contentType,
      ContentLength: input.byteSize,
    }),
    {
      expiresIn: mediaUploadTtlSeconds,
      signableHeaders: new Set(['content-type']),
    },
  )
  return { imageId: objectKey, uploadUrl }
}

/** Public media origin for client-side previews of event cover images. */
export function publicMediaOrigin(): string | null {
  const env = getR2Env()
  if (!env) return null
  const domain = requirePublicDomain(env.publicDomain)
  return domain ? domain.origin : null
}

export interface R2ObjectDetails {
    contentType: string | null
    byteSize: number | null
}

/** Confirm the browser finished the upload and that its signed metadata matches. */
export async function getImageDetails(
    objectKey: string,
    visibility: MediaVisibility,
): Promise<R2ObjectDetails> {
    const env = requireEnv()
    const result = await getClient(env).send(new HeadObjectCommand({
        Bucket: bucketFor(env, visibility),
        Key: objectKey,
    }))
    return {
        contentType: result.ContentType ?? null,
        byteSize: result.ContentLength ?? null,
    }
}

export async function deleteImage(objectKey: string, visibility: MediaVisibility): Promise<void> {
    const env = requireEnv()
    await getClient(env).send(new DeleteObjectCommand({
        Bucket: bucketFor(env, visibility),
        Key: objectKey,
    }))
}

/**
 * Public media uses its public R2 domain. Private media always uses a one-hour
 * S3 presigned GET URL and is never returned through the public host.
 */
export async function resolveDeliveryUrl(
    objectKey: string,
    visibility: MediaVisibility,
): Promise<string | null> {
    const env = getR2Env()
    if (!env) return null

    if (visibility === 'public') {
        const domain = requirePublicDomain(env.publicDomain)
        return domain ? publicObjectUrl(domain, objectKey) : null
    }

    return getSignedUrl(
        getClient(env),
        new GetObjectCommand({
            Bucket: env.privateBucketName,
            Key: objectKey,
        }),
        { expiresIn: mediaDeliveryTtlSeconds },
    )
}

export interface R2Status {
    configured: boolean
    publicDeliveryConfigured: boolean
    privateDeliveryConfigured: boolean
}

export function getR2Status(): R2Status {
    const env = getR2Env()
    return {
        configured: env !== null,
        publicDeliveryConfigured: Boolean(env?.publicDomain),
        privateDeliveryConfigured: env !== null,
    }
}
