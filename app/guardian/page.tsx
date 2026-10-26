import { RoleDashboard } from '@/components/role-dashboard'
import { requireDashboardAccess } from '@/lib/supabase/auth'

export default async function GuardianPage() {
    await requireDashboardAccess('guardian')
    return <RoleDashboard role="guardian" />
}
