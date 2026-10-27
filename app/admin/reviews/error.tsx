'use client'

import { DashboardError } from '@/components/dashboards/dashboard-error'

export default function AdminReviewsError({ error, retry }: { error: unknown; retry: () => void }) {
    return <DashboardError error={error} retry={retry} current="/admin" label="admin review" />
}
