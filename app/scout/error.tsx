'use client'

import { DashboardError } from '@/components/dashboards/dashboard-error'

export default function ScoutError({ error, retry }: { error: unknown; retry: () => void }) {
    return <DashboardError error={error} retry={retry} current="/scout" label="scout" />
}
