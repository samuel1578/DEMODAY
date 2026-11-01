import { GuardianOversight } from '@/components/admin/guardian-oversight'
import { requireDashboardAccess } from '@/lib/supabase/auth'
import { loadAdminGuardianOversight } from '@/lib/supabase/admin-oversight-data'

export default async function AdminGuardiansPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
    await requireDashboardAccess('admin')
    const { result } = await searchParams
    const items = await loadAdminGuardianOversight()
    return <GuardianOversight items={items} result={result} />
}
