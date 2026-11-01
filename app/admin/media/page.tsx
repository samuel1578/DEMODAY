import { MediaModeration } from '@/components/admin/media-moderation'
import { requireDashboardAccess } from '@/lib/supabase/auth'
import { loadAdminMedia } from '@/lib/supabase/admin-oversight-data'
import type { MediaStatus } from '@/lib/supabase/contracts'

const mediaStatuses: MediaStatus[] = ['pending', 'approved', 'rejected']

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<{ status?: string; result?: string }> }) {
    await requireDashboardAccess('admin')
    const { status: requestedStatus, result } = await searchParams
    const filter = requestedStatus === 'all'
        ? 'all'
        : mediaStatuses.includes(requestedStatus as MediaStatus)
            ? requestedStatus as MediaStatus
            : 'pending'
    const items = await loadAdminMedia(filter === 'all' ? undefined : filter)
    return <MediaModeration items={items} filter={filter} result={result} />
}
