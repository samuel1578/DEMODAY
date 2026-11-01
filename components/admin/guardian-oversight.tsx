import { updateAdminGuardianLinkAction } from '@/app/actions/admin-oversight'
import { AdminSectionNavigation } from '@/components/admin/admin-section-nav'
import { SiteShell } from '@/components/site-shell'
import { DashboardHeader, DashboardNotice, StatusPill, consentLabel, statusTone } from '@/components/dashboards/shared'
import { formatShortDate, humanizeToken } from '@/lib/dashboard'
import type { AdminGuardianItem } from '@/lib/supabase/admin-oversight-data'

const resultMessages: Record<string, { tone: 'positive' | 'attention'; message: string }> = {
    rejected: { tone: 'positive', message: 'The pending guardian link was rejected and the decision was recorded.' },
    revoked: { tone: 'positive', message: 'The approved guardian link was revoked and the decision was recorded.' },
    invalid: { tone: 'attention', message: 'That guardian-link request was invalid.' },
    denied: { tone: 'attention', message: 'Only an active administrator can manage guardian links.' },
    'not-found': { tone: 'attention', message: 'That guardian link could not be found.' },
    stale: { tone: 'attention', message: 'The link status changed or that transition is not allowed. Refresh the list.' },
    failed: { tone: 'attention', message: 'The guardian-link update failed. The existing database authorization or transition rules rejected it.' },
}

function GuardianLinkCard({ item, now }: { item: AdminGuardianItem; now: number }) {
    const expired = item.link.status === 'pending'
        && item.link.expires_at !== null
        && Date.parse(item.link.expires_at) <= now
    const canReject = item.link.status === 'pending'
    const canRevoke = item.link.status === 'approved'

    return (
        <article className="rounded-xl border border-foreground/10 bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusPill label={expired ? 'Expired request' : humanizeToken(item.link.status)} tone={expired ? 'attention' : statusTone(item.link.status)} />
                        <StatusPill label={`Athlete account · ${humanizeToken(item.playerStatus)}`} />
                        <StatusPill label={`Guardian account · ${humanizeToken(item.guardianStatus)}`} />
                    </div>
                    <h2 className="mt-3 text-xl font-black uppercase tracking-tight">{item.guardianName} <span className="text-foreground/45">↔</span> {item.playerName}</h2>
                </div>
                <span className="text-xs text-foreground/45">Requested {formatShortDate(item.link.requested_at)}</span>
            </div>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                <div><dt className="text-[10px] uppercase tracking-wider text-foreground/45">Request expiry</dt><dd className="mt-1 font-semibold">{formatShortDate(item.link.expires_at)}</dd></div>
                <div><dt className="text-[10px] uppercase tracking-wider text-foreground/45">Last decision</dt><dd className="mt-1 font-semibold">{formatShortDate(item.link.decided_at)}</dd></div>
                <div><dt className="text-[10px] uppercase tracking-wider text-foreground/45">Updated</dt><dd className="mt-1 font-semibold">{formatShortDate(item.link.updated_at)}</dd></div>
            </dl>

            <section className="mt-5 rounded-lg border border-foreground/10 p-4">
                <h3 className="text-xs font-black uppercase tracking-wider">Latest recorded athlete consent</h3>
                {item.consentStates.length ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                        {item.consentStates.map(state => (
                            <li key={state.consentType} className="inline-flex items-center gap-2 rounded-md border border-foreground/10 px-3 py-2 text-xs">
                                <span className="font-semibold">{consentLabel(state.consentType)}</span>
                                <StatusPill label={humanizeToken(state.decision)} tone={state.decision === 'granted' ? 'positive' : 'attention'} />
                                <time className="text-foreground/45" dateTime={state.recordedAt}>{formatShortDate(state.recordedAt)}</time>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-2 text-sm text-foreground/55">No consent history has been recorded for this athlete.</p>
                )}
            </section>

            {canReject || canRevoke ? (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                    {canReject ? (
                        <form action={updateAdminGuardianLinkAction}>
                            <input type="hidden" name="linkId" value={item.link.id} />
                            <input type="hidden" name="status" value="rejected" />
                            <button className="rounded-md border border-red-500/35 px-4 py-2 text-sm font-bold text-red-700 dark:text-red-300">
                                Reject {expired ? 'expired ' : ''}request
                            </button>
                        </form>
                    ) : null}
                    {canRevoke ? (
                        <form action={updateAdminGuardianLinkAction}>
                            <input type="hidden" name="linkId" value={item.link.id} />
                            <input type="hidden" name="status" value="revoked" />
                            <button className="rounded-md border border-red-500/35 px-4 py-2 text-sm font-bold text-red-700 dark:text-red-300">Revoke link</button>
                        </form>
                    ) : null}
                    <p className="text-xs leading-5 text-foreground/50">Admins can reject or revoke links. Approval remains with the athlete or guardian approval flow.</p>
                </div>
            ) : null}
        </article>
    )
}

export function GuardianOversight({ items, result }: { items: AdminGuardianItem[]; result?: string }) {
    const notice = result ? resultMessages[result] : undefined
    const now = Date.now()
    const pending = items.filter(item => item.link.status === 'pending').length
    const approved = items.filter(item => item.link.status === 'approved').length
    const expired = items.filter(item => item.link.status === 'pending' && item.link.expires_at && Date.parse(item.link.expires_at) <= now).length

    return (
        <SiteShell current="/admin">
            <main className="admin-dashboard mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
                <DashboardHeader
                    eyebrow="Admin · safeguarding"
                    title="Guardian oversight."
                    intro="Monitor guardian-athlete link requests, expiry, and the athlete’s latest recorded consent decisions. This view deliberately excludes contact details, dates of birth, and medical notes."
                />
                <AdminSectionNavigation current="/admin/guardians" />
                {notice ? <div className="mt-6"><DashboardNotice tone={notice.tone}>{notice.message}</DashboardNotice></div> : null}

                <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Guardian link totals">
                    <div className="rounded-lg border border-foreground/10 bg-card p-5"><span className="text-xs uppercase tracking-wider text-foreground/50">Links loaded</span><strong className="mt-2 block text-3xl font-black text-[#1e5128] dark:text-[#F4D03F]">{items.length}</strong></div>
                    <div className="rounded-lg border border-foreground/10 bg-card p-5"><span className="text-xs uppercase tracking-wider text-foreground/50">Pending requests</span><strong className="mt-2 block text-3xl font-black text-[#1e5128] dark:text-[#F4D03F]">{pending}</strong></div>
                    <div className="rounded-lg border border-foreground/10 bg-card p-5"><span className="text-xs uppercase tracking-wider text-foreground/50">Approved · expired pending</span><strong className="mt-2 block text-3xl font-black text-[#1e5128] dark:text-[#F4D03F]">{approved} · {expired}</strong></div>
                </section>

                <section className="mt-8">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h2 className="text-2xl font-black uppercase tracking-tight">Guardian-athlete links</h2>
                        <p className="text-xs text-foreground/50">No approval controls are provided here to preserve athlete consent.</p>
                    </div>
                    {items.length ? (
                        <div className="mt-4 grid gap-4">{items.map(item => <GuardianLinkCard key={item.link.id} item={item} now={now} />)}</div>
                    ) : (
                        <p className="mt-4 rounded-xl border border-dashed border-foreground/20 bg-card p-6 text-sm leading-6 text-foreground/60">
                            No guardian-athlete links have been recorded yet.
                        </p>
                    )}
                </section>
            </main>
        </SiteShell>
    )
}
