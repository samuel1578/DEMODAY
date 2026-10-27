import { EventsManager } from '@/components/admin/events-manager'
import { requireDashboardAccess } from '@/lib/supabase/auth'
import { publicMediaOrigin } from '@/lib/cloudflare/images'
import { loadAllEventsForAdmin } from '@/lib/supabase/events-data'

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
    await requireDashboardAccess('admin')
    const { result } = await searchParams
    const events = await loadAllEventsForAdmin()
    return <EventsManager events={events} result={result} publicOrigin={publicMediaOrigin()} />
}
