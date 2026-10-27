import { PlayerDashboard } from '@/components/dashboards/player-dashboard'
import { requireDashboardAccess } from '@/lib/supabase/auth'
import { loadPlayerDashboard } from '@/lib/supabase/dashboard-data'

export default async function PlayerPage() {
    const user = await requireDashboardAccess('player')
    const data = await loadPlayerDashboard(user)
    return <PlayerDashboard data={data} />
}
