'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { deleteEventAction, saveEventAction, setEventStatusAction } from '@/app/actions/events'
import type { EventListItem } from '@/lib/supabase/events-data'

/**
 * Admin events manager. Writes go through the events server actions, which
 * are authorized by the "Admins can create/update/delete events" RLS policy.
 * Event cover images upload straight to the public R2 bucket.
 */

type EventStatus = EventListItem['status']

const emptyDraft = {
    id: null as string | null,
    title: '',
    description: '',
    category: 'Scout day',
    location: '',
    date: '',
    time: '09:00',
    isSpotlight: false,
    imageKey: null as string | null,
}

type Draft = typeof emptyDraft

const resultMessages: Record<string, string> = {
    saved: 'Event saved.',
    status: 'Event status updated.',
    deleted: 'Event deleted.',
    denied: 'You must be an active administrator to manage events.',
    invalid: 'The event details were not valid. Check every field and try again.',
    failed: 'The event could not be saved. Try again.',
    'spotlight-taken': 'Another event is already the homepage spotlight. Save again to take the spotlight, or unset the other event first.',
    'image-missing': 'The uploaded image could not be verified. Upload it again.',
}

const statusLabels: Record<EventStatus, string> = {
    draft: 'Draft',
    published: 'Published',
    cancelled: 'Cancelled',
    completed: 'Completed',
}

function draftFromEvent(event: EventListItem): Draft {
    return {
        id: event.id,
        title: event.title,
        description: event.description ?? '',
        category: event.category,
        location: event.location,
        date: event.startsAt.slice(0, 10),
        time: event.startsAt.slice(11, 16),
        isSpotlight: event.isSpotlight,
        imageKey: event.imageObjectKey,
    }
}

export function EventsManager({ events, result, publicOrigin }: {
    events: EventListItem[]
    result?: string
    publicOrigin: string | null
}) {
    const [draft, setDraft] = useState<Draft>(emptyDraft)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const [confirmDeleteId, setConfirmDeleteId] = useState('')

    const banner = result ? resultMessages[result] ?? null : null
    const previewUrl = draft.imageKey && publicOrigin
        ? `${publicOrigin}/${draft.imageKey}`
        : null

    async function handleImageSelect(file: File | undefined) {
        setUploadError('')
        if (!file) return
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setUploadError('Only JPEG, PNG, and WebP images are supported.')
            return
        }
        if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
            setUploadError('That image size is not supported (10 MB maximum).')
            return
        }
        setUploading(true)
        try {
            const urlResponse = await fetch('/api/media/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kind: 'event', contentType: file.type, byteSize: file.size }),
            })
            const payload: { imageId?: string; uploadUrl?: string; error?: string } = await urlResponse.json()
            if (!urlResponse.ok || !payload.imageId || !payload.uploadUrl) {
                throw new Error(payload.error || 'The upload could not be started. Try again.')
            }
            const uploadResponse = await fetch(payload.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            })
            if (!uploadResponse.ok) throw new Error('The image upload failed. Try again.')
            setDraft(current => ({ ...current, imageKey: payload.imageId as string }))
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'The image upload failed. Try again.')
        } finally {
            setUploading(false)
        }
    }

    function startEdit(item: EventListItem) {
        setDraft(draftFromEvent(item))
        setUploadError('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
            <header className="flex flex-col justify-between gap-5 border-b border-foreground/10 pb-8 md:flex-row md:items-end">
                <div>
                    <p className="eyebrow">Admin · events</p>
                    <h1 className="display-title mt-3">Run the calendar.</h1>
                    <p className="mt-4 max-w-2xl text-foreground/60">Create events, publish them to the public calendar, and choose the homepage spotlight. Published events appear on /events and the homepage immediately.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/admin" className="w-fit rounded-md border border-foreground/15 px-5 py-3 font-bold">Admin overview</Link>
                    <Link href="/events" className="w-fit rounded-md bg-[#F4D03F] px-5 py-3 font-bold text-[#172219]">View public calendar</Link>
                </div>
            </header>

            {banner && <p role="status" className="mt-6 rounded-md bg-[#1e5128]/10 p-3 text-sm font-semibold text-[#1e5128] dark:text-[#F4D03F]">{banner}</p>}
            {uploadError && <p role="alert" className="mt-4 rounded-md bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{uploadError}</p>}

            <div className="mt-8 grid items-start gap-6 lg:grid-cols-[.85fr_1.15fr]">
                <form action={saveEventAction} className="rounded-xl border border-foreground/10 bg-card p-5">
                    <h2 className="text-xl font-black uppercase">{draft.id ? 'Edit event' : 'Create event'}</h2>
                    {draft.id && <input type="hidden" name="id" value={draft.id} />}
                    <input type="hidden" name="imageObjectKey" value={draft.imageKey ?? ''} />
                    <div className="mt-5 grid gap-4">
                        <label className="block text-xs font-bold uppercase tracking-wider">
                            Event title
                            <input required maxLength={120} value={draft.title} onChange={event => setDraft(d => ({ ...d, title: event.target.value }))} className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#1e5128]" />
                        </label>
                        <label className="block text-xs font-bold uppercase tracking-wider">
                            Description
                            <textarea maxLength={2000} rows={3} value={draft.description} onChange={event => setDraft(d => ({ ...d, description: event.target.value }))} className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#1e5128]" />
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block text-xs font-bold uppercase tracking-wider">
                                Category
                                <input required maxLength={80} value={draft.category} onChange={event => setDraft(d => ({ ...d, category: event.target.value }))} className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#1e5128]" />
                            </label>
                            <label className="block text-xs font-bold uppercase tracking-wider">
                                Location
                                <input required maxLength={160} value={draft.location} onChange={event => setDraft(d => ({ ...d, location: event.target.value }))} className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#1e5128]" />
                            </label>
                            <label className="block text-xs font-bold uppercase tracking-wider">
                                Date
                                <input required type="date" value={draft.date} onChange={event => setDraft(d => ({ ...d, date: event.target.value }))} className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#1e5128]" />
                            </label>
                            <label className="block text-xs font-bold uppercase tracking-wider">
                                Time
                                <input required type="time" value={draft.time} onChange={event => setDraft(d => ({ ...d, time: event.target.value }))} className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#1e5128]" />
                            </label>
                        </div>

                        <div className="rounded-md border border-foreground/10 bg-background p-4">
                            <p className="text-xs font-bold uppercase tracking-wider">Cover image <span className="font-normal normal-case text-foreground/45">· optional, public</span></p>
                            {previewUrl ? (
                                <div className="mt-3">
                                    <img src={previewUrl} alt="Event cover preview" className="h-36 w-full rounded-md object-cover" />
                                    <div className="mt-2 flex gap-2">
                                        <label className="cursor-pointer rounded-md border border-foreground/15 px-3 py-1.5 text-xs font-bold">
                                            Replace
                                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={event => handleImageSelect(event.target.files?.[0])} disabled={uploading} />
                                        </label>
                                        <button type="button" onClick={() => setDraft(d => ({ ...d, imageKey: null }))} className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-600">Remove image</button>
                                    </div>
                                </div>
                            ) : (
                                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-foreground/15 px-3 py-2 text-sm font-bold">
                                    <ImagePlus size={16} />{uploading ? 'Uploading…' : 'Upload cover image'}
                                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={event => handleImageSelect(event.target.files?.[0])} disabled={uploading} />
                                </label>
                            )}
                        </div>

                        <label className="flex items-center gap-2 text-sm font-bold">
                            <input type="checkbox" checked={draft.isSpotlight} onChange={event => setDraft(d => ({ ...d, isSpotlight: event.target.checked }))} className="size-4 accent-[#1e5128]" />
                            Homepage spotlight (only one event can hold this)
                        </label>

                        <div className="flex gap-2">
                            <button disabled={uploading} className="inline-flex items-center gap-2 rounded-md bg-[#1e5128] px-4 py-2.5 font-bold text-white disabled:opacity-50">
                                <Plus size={17} />{draft.id ? 'Save changes' : 'Add event'}
                            </button>
                            {draft.id && (
                                <button type="button" onClick={() => setDraft(emptyDraft)} className="rounded-md border border-foreground/15 px-4 py-2.5 font-bold">
                                    Cancel edit
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                <section className="space-y-3">
                    <h2 className="text-xl font-black uppercase">Calendar · {events.length}</h2>
                    {events.map(item => (
                        <article key={item.id} className="rounded-xl border border-foreground/10 bg-card p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-[#E67E22]">{item.category}</span>
                                        <span className="rounded-full bg-foreground/5 px-2 py-1 text-[10px] font-black uppercase">{statusLabels[item.status]}</span>
                                        {item.isSpotlight && <span className="rounded-full bg-[#F4D03F]/30 px-2 py-1 text-[10px] font-black uppercase">Spotlight</span>}
                                    </div>
                                    <h3 className="mt-2 text-xl font-black uppercase">{item.title}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => startEdit(item)} className="rounded-md border border-foreground/15 px-3 py-1.5 text-sm font-bold">Edit</button>
                                    {confirmDeleteId === item.id ? (
                                        <form action={deleteEventAction}>
                                            <input type="hidden" name="id" value={item.id} />
                                            <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-bold text-white">Confirm delete</button>
                                        </form>
                                    ) : (
                                        <button onClick={() => setConfirmDeleteId(item.id)} aria-label={`Delete ${item.title}`} className="rounded-md border border-red-500/30 p-2 text-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {item.description && <p className="mt-2 text-sm text-foreground/60">{item.description}</p>}
                            <p className="mt-3 text-sm font-semibold">{item.longDateLabel} · {item.timeLabel} · {item.location}</p>
                            <form action={setEventStatusAction} className="mt-4 flex flex-wrap items-center gap-2">
                                <input type="hidden" name="id" value={item.id} />
                                <select name="status" defaultValue={item.status} className="rounded-md border border-foreground/15 bg-background px-3 py-1.5 text-sm font-bold">
                                    {(Object.keys(statusLabels) as EventStatus[]).map(status => (
                                        <option key={status} value={status}>{statusLabels[status]}</option>
                                    ))}
                                </select>
                                <button className="rounded-md bg-[#1e5128]/10 px-3 py-1.5 text-xs font-bold text-[#1e5128] dark:text-[#F4D03F]">Apply status</button>
                            </form>
                        </article>
                    ))}
                    {!events.length && (
                        <p className="rounded-xl border border-dashed border-foreground/20 p-6 text-sm text-foreground/60">
                            No events yet. Add one to populate the public events page.
                        </p>
                    )}
                </section>
            </div>
        </main>
    )
}
