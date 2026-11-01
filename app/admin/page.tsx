import { AdminDashboard } from '@/components/admin-dashboard'
import { requireDashboardAccess } from '@/lib/supabase/auth'
import { loadAdminOverview } from '@/lib/supabase/admin-oversight-data'

export default async function AdminPage() {
  await requireDashboardAccess('admin')
  const data = await loadAdminOverview()
  return <AdminDashboard data={data} />
}
