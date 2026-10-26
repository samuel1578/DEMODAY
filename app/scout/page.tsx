import { RoleDashboard } from '@/components/role-dashboard'
import { requireDashboardAccess } from '@/lib/supabase/auth'

export default async function ScoutPage() {
    await requireDashboardAccess('scout')
    return <RoleDashboard role="scout" />
}
