'use client'

import { useEffect } from 'react'
import { CircleAlert } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'

/**
 * Error boundary UI for a role dashboard route segment. Used by the route's
 * `error.tsx`, which must be a Client Component.
 */
export function DashboardError({
    error,
    retry,
    current,
    label,
}: {
    error: unknown
    retry: () => void
    current: string
    label: string
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <SiteShell current={current}>
            <main className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-20">
                <section className="rounded-xl border border-foreground/10 bg-card p-8 sm:p-12">
                    <CircleAlert className="size-10 text-[#E67E22]" aria-hidden="true" />
                    <p className="eyebrow mt-5">Dashboard unavailable</p>
                    <h1 className="display-title mt-4">We could not load your {label} dashboard.</h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/65">
                        Your saved account and profile data is unchanged. This usually means a request failed or the server was briefly unavailable.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <button onClick={() => retry()} className="rounded-md bg-[#F4D03F] px-5 py-3 text-sm font-bold text-[#172219]">
                            Try again
                        </button>
                        <a href="/account/pending" className="rounded-md border border-foreground/15 px-5 py-3 text-sm font-bold">
                            Account status
                        </a>
                    </div>
                </section>
            </main>
        </SiteShell>
    )
}
