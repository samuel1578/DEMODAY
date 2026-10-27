import { CalendarDays, ShieldCheck, Users } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import {
    Card,
    DashboardHeader,
    DashboardNotice,
    StatCard,
    StatGrid,
    StatusPill,
    statusLabelFor,
    statusTone,
} from '@/components/dashboards/shared'
import { accountDisplayName, formatShortDate, humanizeToken, profileRoleLabel } from '@/lib/dashboard'
import { updateProfileStatusAction, updateScoutVettingStatusAction } from '@/app/actions/admin'
import type { AdminReviewData } from '@/lib/supabase/dashboard-data'
import type { AccountProfile, AuditLogEntry, ProfileRole, ProfileStatus } from '@/lib/supabase/contracts'

const selectableStatuses: ProfileStatus[] = ['pending', 'reviewed', 'approved', 'active', 'rejected']
const roleOrder: ProfileRole[] = ['player', 'scout', 'guardian', 'admin']
const statusOrder: Record<string, number> = { pending: 0, reviewed: 1, approved: 2, active: 3, rejected: 4 }

const auditActionLabels: Record<AuditLogEntry['action'], string> = {
    profile_status_changed: 'Account status changed',
    scout_vetting_changed: 'Scout vetting changed',
    guardian_link_status_changed: 'Guardian link changed',
    consent_recorded: 'Consent recorded',
    event_status_changed: 'Event status changed',
}

const resultMessages: Record<string, { tone: 'positive' | 'attention'; message: string }> = {
    updated: { tone: 'positive', message: 'Review decision saved and recorded in the audit trail.' },
    invalid: { tone: 'attention', message: 'That review request was not valid. Choose an account and a listed status.' },
    denied: { tone: 'attention', message: 'Only an active administrator account can change review status.' },
    failed: { tone: 'attention', message: 'The database rejected that change. Confirm the account still exists and try again.' },
}

function ReviewSelect({
    action,
    userId,
    current,
    label,
}: {
    action: (formData: FormData) => Promise<void>
    userId: string
    current: string | null
    label: string
}) {
    return (
        <form action={action} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="userId" value={userId} />
            <label className="sr-only" htmlFor={`status-${label}-${userId}`}>{label}</label>
            <select
                id={`status-${label}-${userId}`}
                name="status"
                defaultValue={current ?? 'pending'}
                className="rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm"
            >
                {selectableStatuses.map(status => (
                    <option key={status} value={status}>{statusLabelFor(status)}</option>
                ))}
            </select>
            <button className="rounded-md bg-[#1e5128] px-4 py-2 text-sm font-bold text-white">{label}</button>
        </form>
    )
}

function ProfileRow({ profile, vettingStatus }: { profile: AccountProfile; vettingStatus?: string | null }) {
    return (
        <article className="rounded-xl border border-foreground/10 bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusPill label={profileRoleLabel(profile.role)} />
                        <StatusPill label={statusLabelFor(profile.status)} tone={statusTone(profile.status)} />
                        {profile.role === 'scout' && vettingStatus ? (
                            <StatusPill label={`Vetting: ${statusLabelFor(vettingStatus)}`} tone={statusTone(vettingStatus)} />
                        ) : null}
                    </div>
                    <h3 className="mt-3 truncate text-lg font-black uppercase tracking-tight">
                        {accountDisplayName(profile.first_name, profile.last_name, `Unnamed ${profileRoleLabel(profile.role).toLowerCase()}`)}
                    </h3>
                    <p className="mt-1 text-xs text-foreground/50">Joined {formatShortDate(profile.created_at)}</p>
                </div>
                <span className="font-mono text-[10px] text-foreground/40">{profile.user_id}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-4">
                <div>
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-foreground/45">Account review</p>
                    <ReviewSelect action={updateProfileStatusAction} userId={profile.user_id} current={profile.status} label="Save status" />
                </div>
                {profile.role === 'scout' && (
                    <div>
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-foreground/45">Scout vetting</p>
                        <ReviewSelect action={updateScoutVettingStatusAction} userId={profile.user_id} current={vettingStatus ?? 'pending'} label="Save vetting" />
                    </div>
                )}
            </div>
        </article>
    )
}

export function AdminReview({ data, result }: { data: AdminReviewData; result?: string }) {
    const vettingByUser = new Map(data.scoutVettings.map(record => [record.user_id, record.vetting_status]))
    const profiles = [...data.profiles].sort((a, b) => {
        const byStatus = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
        if (byStatus !== 0) return byStatus
        return a.created_at < b.created_at ? 1 : -1
    })

    const pending = data.profiles.filter(profile => profile.status === 'pending' || profile.status === 'reviewed').length
    const approved = data.profiles.filter(profile => profile.status === 'approved' || profile.status === 'active').length
    const rejected = data.profiles.filter(profile => profile.status === 'rejected').length
    const notice = result ? resultMessages[result] : undefined

    return (
        <SiteShell current="/admin">
            <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
                <DashboardHeader
                    eyebrow="Demo Day CEO dashboard · review"
                    title="Review the network."
                    intro="Every account review decision here is written through guarded database functions and appended to a shared audit trail, so athlete, scout and guardian outcomes stay connected."
                    secondary={(
                        <>
                            <a href="/admin" className="flex items-center gap-2 rounded-md border border-foreground/15 px-5 py-3 font-bold">
                                <Users className="size-4" aria-hidden="true" /> Operations dashboard
                            </a>
                            <a href="/events" className="flex items-center gap-2 rounded-md bg-[#F4D03F] px-5 py-3 font-bold text-[#172219]">
                                <CalendarDays className="size-4" aria-hidden="true" /> Public calendar
                            </a>
                        </>
                    )}
                />

                {notice ? (
                    <div className="mt-6">
                        <DashboardNotice tone={notice.tone}>{notice.message}</DashboardNotice>
                    </div>
                ) : null}

                <StatGrid>
                    <StatCard label="Accounts" value={String(data.profiles.length)} hint="Every role counted together." />
                    <StatCard label="Awaiting review" value={String(pending)} hint="Pending or reviewed accounts." />
                    <StatCard label="Approved or active" value={String(approved)} hint="Accounts cleared for their dashboards." />
                    <StatCard label="Rejected" value={String(rejected)} hint="Decisions are recorded, never deleted." />
                </StatGrid>

                <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {roleOrder.map(role => (
                        <div key={role} className="rounded-lg border border-foreground/10 bg-card p-5">
                            <span className="text-xs uppercase tracking-wider text-foreground/50">{profileRoleLabel(role)}s</span>
                            <strong className="mt-2 block text-3xl font-black text-[#1e5128] dark:text-[#F4D03F]">
                                {data.profiles.filter(profile => profile.role === role).length}
                            </strong>
                        </div>
                    ))}
                </section>

                <section className="mt-10">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Review queue · {profiles.length}</h2>
                    {profiles.length ? (
                        <div className="mt-5 grid gap-4">
                            {profiles.map(profile => (
                                <ProfileRow key={profile.user_id} profile={profile} vettingStatus={vettingByUser.get(profile.user_id)} />
                            ))}
                        </div>
                    ) : (
                        <p className="mt-5 rounded-xl border border-dashed border-foreground/20 bg-card p-6 text-sm leading-6 text-foreground/60">
                            No accounts are available for review. Accounts appear here once users sign up.
                        </p>
                    )}
                </section>

                <section className="mt-10">
                    <Card title="Recent safeguarding activity">
                        {data.audit.length ? (
                            <ul className="flex flex-col">
                                {data.audit.map(entry => (
                                    <li key={entry.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-foreground/10 py-3 last:border-b-0">
                                        <span className="flex items-start gap-3">
                                            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#1e5128] dark:text-[#F4D03F]" aria-hidden="true" />
                                            <span>
                                                <b className="block text-sm font-bold">{auditActionLabels[entry.action] ?? humanizeToken(entry.action)}</b>
                                                <span className="mt-0.5 block text-xs text-foreground/55">
                                                    {humanizeToken(entry.entity_type)}
                                                    {entry.old_status || entry.new_status
                                                        ? ` · ${entry.old_status ? statusLabelFor(entry.old_status) : 'none'} → ${entry.new_status ? statusLabelFor(entry.new_status) : 'none'}`
                                                        : ''}
                                                </span>
                                            </span>
                                        </span>
                                        <span className="text-xs text-foreground/45">{formatShortDate(entry.created_at)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm leading-6 text-foreground/60">
                                No review decisions have been recorded yet. Status changes append entries here with the acting administrator.
                            </p>
                        )}
                    </Card>
                </section>
            </main>
        </SiteShell>
    )
}
