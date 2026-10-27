import { GuardianDashboard } from '@/components/dashboards/guardian-dashboard'
import { requireDashboardAccess } from '@/lib/supabase/auth'
import { loadGuardianDashboard } from '@/lib/supabase/dashboard-data'

export default async function GuardianPage() {
    const user = await requireDashboardAccess('guardian')
    const data = await loadGuardianDashboard(user)
    return <GuardianDashboard data={data} />
}
