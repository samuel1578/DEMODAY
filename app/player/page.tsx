import { RoleDashboard } from '@/components/role-dashboard'
import { requireDashboardAccess } from '@/lib/supabase/auth'

export default async function PlayerPage() {
    await requireDashboardAccess('player')
    return <RoleDashboard role="player" />
}
