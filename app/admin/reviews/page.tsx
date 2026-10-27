import { AdminReview } from '@/components/dashboards/admin-review'
import { requireDashboardAccess } from '@/lib/supabase/auth'
import { loadAdminReview } from '@/lib/supabase/dashboard-data'

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
    await requireDashboardAccess('admin')
    const { result } = await searchParams
    const data = await loadAdminReview()
    return <AdminReview data={data} result={result} />
}
