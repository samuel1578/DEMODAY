import { AdminDashboard } from '@/components/admin-dashboard'
import { requireDashboardAccess } from '@/lib/supabase/auth'

export default async function AdminPage() {
  await requireDashboardAccess('admin')
  return <AdminDashboard />
}
