import { notFound } from 'next/navigation'
import { ProfileSubmissionReview } from '@/components/admin/profile-submission-review'
import { requireDashboardAccess } from '@/lib/supabase/auth'
import { loadAdminProfileSubmission } from '@/lib/supabase/admin-oversight-data'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function AdminProfileSubmissionPage({
    params,
}: {
    params: Promise<{ userId: string }>
}) {
    await requireDashboardAccess('admin')
    const { userId } = await params
    if (!uuidPattern.test(userId)) notFound()

    const review = await loadAdminProfileSubmission(userId)
    if (!review) notFound()

    return <ProfileSubmissionReview review={review} />
}
