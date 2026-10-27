import Link from 'next/link'
import { Clock3, ShieldCheck, UserRoundCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { SiteShell } from '@/components/site-shell'
import { requireAuthenticatedUser } from '@/lib/supabase/auth'
import { getAccountOnboardingProgress } from '@/lib/supabase/onboarding-state'

const statusLabel: Record<string, string> = {
    pending: 'Pending review',
    approved: 'Approved',
    active: 'Active',
    rejected: 'Rejected',
    reviewed: 'Reviewed',
}

export default async function AccountPendingPage() {
    const user = await requireAuthenticatedUser()
    const progress = await getAccountOnboardingProgress(user)
    const status = progress.accountStatus ?? 'pending'
    const hasIncompleteProfile = !progress.profileComplete
    const needsGuardianStep = progress.role === 'player' && progress.under18GuardianApprovalComplete === false

    return (
        <SiteShell current="/account/pending">
            <main className="mx-auto max-w-4xl px-5 py-16 lg:px-8 lg:py-20">
                <section className="account-status-panel rounded-xl border border-foreground/10 bg-card p-8 sm:p-12">
                    <Clock3 className="size-10 text-[#1e5128]" aria-hidden="true" />
                    <p className="eyebrow mt-5">Account status</p>
                    <h1 className="display-title mt-4">Your account is not ready for a dashboard yet.</h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/65">
                        Account review is independent from onboarding. Completing a profile never approves your account or a scout vetting decision.
                    </p>

                    <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                        <StatusCard icon={<UserRoundCheck className="size-5" />} title="Saved account role" value={progress.role ?? 'Not available'} />
                        <StatusCard icon={<Clock3 className="size-5" />} title="Account review" value={statusLabel[status] ?? status} />
                        {progress.role === 'scout' && (
                            <StatusCard icon={<ShieldCheck className="size-5" />} title="Scout vetting" value={statusLabel[progress.scoutVettingStatus ?? 'pending'] ?? progress.scoutVettingStatus ?? 'Not started'} />
                        )}
                        <StatusCard icon={<ShieldCheck className="size-5" />} title="Role profile" value={progress.profileComplete ? 'Complete' : 'Incomplete'} />
                    </dl>

                    {status === 'rejected' ? (
                        <p className="mt-7 rounded-md border border-[#E67E22]/40 bg-[#E67E22]/10 p-4 text-sm leading-6 text-foreground/75">
                            This account has a rejected review status. Profile changes cannot reverse that decision; contact the Demo Day safeguarding or account team for next steps.
                        </p>
                    ) : null}

                    {hasIncompleteProfile && status !== 'rejected' && (
                        <p className="mt-7 text-sm leading-6 text-foreground/65">
                            {progress.missing.length ? `Still required: ${progress.missing.join('; ')}.` : 'Complete the role-specific profile and consent steps.'}
                        </p>
                    )}
                    {needsGuardianStep && (
                        <p className="mt-7 rounded-md border border-[#E67E22]/35 bg-[#E67E22]/10 p-4 text-sm leading-6 text-foreground/75">
                            Under-18 dashboard access also requires an approved guardian relationship and current guardian-attributed participation, media, safeguarding, and financial consent records.
                        </p>
                    )}
                    {progress.role === 'scout' && progress.profileComplete && progress.scoutVettingStatus !== 'approved' && progress.scoutVettingStatus !== 'active' && (
                        <p className="mt-7 rounded-md border border-[#F4D03F]/30 bg-background p-4 text-sm leading-6 text-foreground/70">
                            Your complete application is waiting for an independent vetting decision. Onboarding does not change scout vetting status.
                        </p>
                    )}

                    <div className="mt-8 flex flex-wrap gap-3">
                        {progress.role && progress.role !== 'admin' && hasIncompleteProfile && status !== 'rejected' && (
                            <Link href="/account/onboarding" className="rounded-md bg-[#F4D03F] px-5 py-3 text-sm font-bold text-[#172219]">
                                {needsGuardianStep ? 'Refresh guardian invitation' : progress.profileComplete ? 'Update profile' : 'Complete onboarding'}
                            </Link>
                        )}
                        {progress.role === 'player' && (
                            <Link href="/account/guardian-approval" className="rounded-md border border-foreground/15 px-5 py-3 text-sm font-bold">
                                Guardian requests and status
                            </Link>
                        )}
                        {progress.role === 'guardian' && (
                            <Link href="/account/guardian-approval" className="rounded-md border border-foreground/15 px-5 py-3 text-sm font-bold">
                                Guardian links and consent
                            </Link>
                        )}
                        <Link href="/sign-in" className="rounded-md border border-foreground/15 px-5 py-3 text-sm font-bold">Return to sign in</Link>
                        <Link href="/safeguarding" className="rounded-md border border-foreground/15 px-5 py-3 text-sm font-bold">Safeguarding information</Link>
                    </div>
                </section>
            </main>
        </SiteShell>
    )
}

function StatusCard({ icon, title, value }: { icon: ReactNode; title: string; value: string }) {
    return (
        <div className="flex items-center gap-3 rounded-md border border-foreground/10 bg-background p-4">
            <span className="text-[#F4D03F]">{icon}</span>
            <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-foreground/45">{title}</dt>
                <dd className="mt-1 text-sm font-bold capitalize">{value}</dd>
            </div>
        </div>
    )
}
