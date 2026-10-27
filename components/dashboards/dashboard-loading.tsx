import { SiteShell } from '@/components/site-shell'

/**
 * Instant loading skeleton for a role dashboard route segment. Rendered by
 * Next's Suspense boundary in the route's `loading.tsx`.
 */
export function DashboardLoading({ current, label }: { current: string; label: string }) {
    return (
        <SiteShell current={current}>
            <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16" aria-busy="true" aria-live="polite">
                <span className="sr-only">Loading {label} dashboard…</span>
                <div className="h-3 w-32 animate-pulse rounded bg-foreground/10" />
                <div className="mt-6 h-10 w-2/3 max-w-xl animate-pulse rounded bg-foreground/10" />
                <div className="mt-4 h-4 w-1/2 max-w-md animate-pulse rounded bg-foreground/10" />
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[0, 1, 2, 3].map(index => (
                        <div key={index} className="h-28 animate-pulse rounded-lg border border-foreground/10 bg-card" />
                    ))}
                </div>
                <div className="mt-8 h-64 animate-pulse rounded-xl border border-foreground/10 bg-card" />
            </main>
        </SiteShell>
    )
}
