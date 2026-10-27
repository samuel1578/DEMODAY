'use client'

import { useRef, useState } from 'react'
import { Camera, CircleAlert, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { deleteMediaAction, saveMediaAction } from '@/app/actions/media'
import { formatBytes, imageContentTypes, maxImageBytes, mediaTypeLabels, type ImageContentType } from '@/lib/media'
import type { MediaType } from '@/lib/supabase/contracts'

export interface PhotoUploadFieldProps {
    mediaType: MediaType
    label?: string
    hint?: string
    required?: boolean
    /** Set when the deployment has no R2 credentials yet. */
    disabledReason?: string | null
    initial?: { mediaId: string; deliveryUrl: string | null } | null
}

interface UploadUrlResponse {
    imageId?: string
    uploadUrl?: string
    visibility?: 'public' | 'private'
    error?: string
}

/**
 * Profile photo field backed by R2. The browser requests a presigned URL,
 * uploads the file straight to R2, and only then
 * asks the server to verify and store the image id. No image data URL ever
 * enters the app or its storage.
 */
export function PhotoUploadField({ mediaType, label, hint, required, disabledReason, initial }: PhotoUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [mediaId, setMediaId] = useState<string | null>(initial?.mediaId ?? null)
    const [imageUrl, setImageUrl] = useState<string | null>(initial?.deliveryUrl ?? null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)

    const title = label ?? mediaTypeLabels[mediaType]

    async function handleFile(file: File | undefined) {
        if (!file) return
        setError(null)
        setNotice(null)

        if (!imageContentTypes.includes(file.type as ImageContentType)) {
            setError('Upload a JPEG, PNG, or WebP image.')
            return
        }
        if (file.size > maxImageBytes) {
            setError(`Keep images at or under ${formatBytes(maxImageBytes)}.`)
            return
        }

        setBusy(true)
        try {
            const urlResponse = await fetch('/api/media/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mediaType, contentType: file.type, byteSize: file.size }),
            })
            const payload = await urlResponse.json().catch(() => null) as UploadUrlResponse | null
            if (!urlResponse.ok || !payload?.uploadUrl || !payload.imageId) {
                setError(payload?.error ?? 'The upload could not be started. Try again.')
                return
            }

            const uploadResponse = await fetch(payload.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            })
            if (!uploadResponse.ok) {
                setError('The image upload failed. Try again.')
                return
            }

            // Only record metadata once R2 has confirmed the upload.
            const saved = await saveMediaAction({
                mediaType,
                imageId: payload.imageId,
                contentType: file.type,
                byteSize: file.size,
            })
            if (saved.status !== 'success') {
                setError(saved.message ?? 'The image could not be saved.')
                return
            }

            setMediaId(saved.mediaId ?? null)
            setImageUrl(saved.deliveryUrl ?? null)
            setNotice(saved.deliveryUrl
                ? 'Image saved.'
                : payload.visibility === 'private'
                    ? 'Image saved privately, but its preview could not be created.'
                    : 'Image saved, but public delivery is not configured.')
        } catch {
            setError('The image upload failed. Try again.')
        } finally {
            setBusy(false)
        }
    }

    async function handleRemove() {
        if (!mediaId) return
        setError(null)
        setNotice(null)
        setBusy(true)
        try {
            const removed = await deleteMediaAction({ mediaId })
            if (removed.status !== 'success') {
                setError(removed.message ?? 'The image could not be removed.')
                return
            }
            setMediaId(null)
            setImageUrl(null)
            setNotice('Image removed.')
        } catch {
            setError('The image could not be removed. Try again.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="sm:col-span-2">
            <span className={labelClass}>
                {title}{required && <span className="ml-1 text-[#E67E22]">*</span>}
            </span>
            {hint && <span className="mt-1 block text-xs leading-5 text-foreground/50">{hint}</span>}

            {disabledReason ? (
                <p className="mt-3 flex items-start gap-3 rounded-md border border-[#E67E22]/35 bg-[#E67E22]/10 p-4 text-sm leading-6 text-foreground/75" role="status">
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#E67E22]" aria-hidden="true" />
                    {disabledReason}
                </p>
            ) : (
                <div className="mt-3 flex flex-wrap items-center gap-5 rounded-md border border-dashed border-foreground/20 bg-card p-5">
                    <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-foreground/15 bg-background">
                        {imageUrl ? (
                            <img src={imageUrl} alt={title} className="size-full object-cover" />
                        ) : (
                            <Camera className="size-7 text-foreground/30" aria-hidden="true" />
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <input
                            ref={inputRef}
                            type="file"
                            accept={imageContentTypes.join(',')}
                            className="hidden"
                            onChange={event => {
                                void handleFile(event.target.files?.[0])
                                event.target.value = ''
                            }}
                        />
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => inputRef.current?.click()}
                            className="flex w-fit items-center gap-2 rounded-md border border-foreground/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition hover:border-[#F4D03F] disabled:opacity-50"
                        >
                            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
                            {busy ? 'Uploading…' : mediaId ? 'Replace image' : 'Upload image'}
                        </button>
                        {mediaId && (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleRemove()}
                                className="flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/45 transition hover:text-[#E67E22] disabled:opacity-50"
                            >
                                <Trash2 className="size-3.5" aria-hidden="true" /> Remove
                            </button>
                        )}
                        <span className="text-xs leading-5 text-foreground/50">
                            JPEG, PNG or WebP up to {formatBytes(maxImageBytes)}. Uploaded directly to R2 storage.
                        </span>
                    </div>
                </div>
            )}

            {error && <span className="mt-2 block text-xs font-bold text-[#E67E22]" role="alert">{error}</span>}
            {notice && !error && <span className="mt-2 block text-xs font-bold text-[#1e5128] dark:text-[#F4D03F]" role="status">{notice}</span>}
        </div>
    )
}

const labelClass = 'block text-xs font-bold uppercase tracking-wider'
