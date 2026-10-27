import { ScoutDashboard } from '@/components/dashboards/scout-dashboard'
import { requireDashboardAccess } from '@/lib/supabase/auth'
import { loadScoutDashboard } from '@/lib/supabase/dashboard-data'

export default async function ScoutPage() {
    const user = await requireDashboardAccess('scout')
    const data = await loadScoutDashboard(user)
    return <ScoutDashboard data={data} />
}
