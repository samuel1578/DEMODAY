'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { deleteImage, getImageDetails } from '@/lib/cloudflare/images'
import { createClient } from '@/lib/supabase/server'

/**
 * Server-backed event management. Authorization is enforced by the events
 * RLS policies ("Admins can create/update/delete events"), not by this
 * server code: the checks here only fail fast before the request reaches
 * the database. Status changes are audited by the events audit trigger.
 */

const uuidPattern = /^[0-9a-f-]{36}$/i
const eventImageKeyPattern = /^events\/[0-9a-f-]{36}\.(jpg|png|webp)$/i
const eventStatuses = ['draft', 'published', 'cancelled', 'completed'] as const
type EventStatus = (typeof eventStatuses)[number]

const fieldLimits = {
    title: 120,
    description: 2000,
    category: 80,
    location: 160,
} as const

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

function backToEvents(result: string): never {
    redirect(`/admin/events?result=${result}`)
}

function readText(formData: FormData, name: string, max: number, required: boolean): string | null {
    const raw = formData.get(name)
    if (typeof raw !== 'string') return required ? null : ''
    const value = raw.trim()
    if (!value) return required ? null : ''
    if (value.length > max) return null
    return value
}

export async function saveEventAction(formData: FormData): Promise<void> {
    const idRaw = formData.get('id')
    const id = typeof idRaw === 'string' && uuidPattern.test(idRaw) ? idRaw : null

    const title = readText(formData, 'title', fieldLimits.title, true)
    const description = readText(formData, 'description', fieldLimits.description, false)
    const category = readText(formData, 'category', fieldLimits.category, true)
    const location = readText(formData, 'location', fieldLimits.location, true)
    const date = formData.get('date')
    const time = formData.get('time')
    const isSpotlight = formData.get('isSpotlight') === 'on'
    const imageObjectKeyRaw = formData.get('imageObjectKey')
    const imageObjectKey = typeof imageObjectKeyRaw === 'string' && imageObjectKeyRaw.trim()
        ? imageObjectKeyRaw.trim()
        : null

    if (!title || !category || !location) backToEvents('invalid')
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) backToEvents('invalid')
    if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) backToEvents('invalid')
    if (imageObjectKey && !eventImageKeyPattern.test(imageObjectKey)) backToEvents('invalid')

    const startsAt = new Date(`${date}T${time}:00Z`)
    if (Number.isNaN(startsAt.getTime())) backToEvents('invalid')

    if (imageObjectKey) {
        try {
            await getImageDetails(imageObjectKey, 'public')
        } catch {
            backToEvents('image-missing')
        }
    }

    const supabase = await getActiveAdminClient()
    if (!supabase) backToEvents('denied')

    // The spotlight partial unique index allows only one event; demote the
    // current holder before writing the new one.
    if (isSpotlight) {
        const clear = supabase
            .from('events')
            .update({ is_spotlight: false })
            .eq('is_spotlight', true)
        if (id) clear.neq('id', id)
        await clear
    }

    const payload = {
        title,
        description: description || null,
        category,
        location,
        starts_at: startsAt.toISOString(),
        is_spotlight: isSpotlight,
        image_object_key: imageObjectKey,
    }

    const { error } = id
        ? await supabase.from('events').update(payload).eq('id', id).select('id').maybeSingle()
        : await supabase.from('events').insert(payload).select('id').maybeSingle()

    if (error) {
        if (error.code === '23505') backToEvents('spotlight-taken')
        backToEvents('failed')
    }

    revalidatePath('/')
    revalidatePath('/events')
    revalidatePath('/admin/events')
    backToEvents('saved')
}

export async function setEventStatusAction(formData: FormData): Promise<void> {
    const id = formData.get('id')
    const status = formData.get('status')
    if (typeof id !== 'string' || !uuidPattern.test(id)) backToEvents('invalid')
    if (typeof status !== 'string' || !eventStatuses.includes(status as EventStatus)) backToEvents('invalid')

    const supabase = await getActiveAdminClient()
    if (!supabase) backToEvents('denied')

    const { data, error } = await supabase
        .from('events')
        .update({ status: status as EventStatus })
        .eq('id', id)
        .select('id')
        .maybeSingle()
    if (error || !data) backToEvents('failed')

    revalidatePath('/')
    revalidatePath('/events')
    revalidatePath('/admin/events')
    backToEvents('status')
}

export async function deleteEventAction(formData: FormData): Promise<void> {
    const id = formData.get('id')
    if (typeof id !== 'string' || !uuidPattern.test(id)) backToEvents('invalid')

    const supabase = await getActiveAdminClient()
    if (!supabase) backToEvents('denied')

    const { data: row, error: readError } = await supabase
        .from('events')
        .select('image_object_key')
        .eq('id', id)
        .maybeSingle()
    if (readError || !row) backToEvents('failed')

    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) backToEvents('failed')

    const imageKey = row.image_object_key as string | null
    if (imageKey) {
        try {
            await deleteImage(imageKey, 'public')
        } catch {
            // Best effort: the object is unreferenced once the event is gone.
        }
    }

    revalidatePath('/')
    revalidatePath('/events')
    revalidatePath('/admin/events')
    backToEvents('deleted')
}
