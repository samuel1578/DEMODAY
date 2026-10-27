'use client'

import { DashboardError } from '@/components/dashboards/dashboard-error'

export default function PlayerError({ error, retry }: { error: unknown; retry: () => void }) {
    return <DashboardError error={error} retry={retry} current="/player" label="athlete" />
}
