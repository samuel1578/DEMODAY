import { CalendarDays } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import {
    Card,
    ConsentPanel,
    DashboardHeader,
    DashboardNotice,
    EmptyPanel,
    FieldGrid,
    NextSteps,
    RequirementList,
    StatCard,
    StatGrid,
    StatusPill,
    maybeLabel,
    statusLabelFor,
    statusTone,
} from '@/components/dashboards/shared'
import { formatShortDate, guardianDelegatedConsentTypes, humanizeToken } from '@/lib/dashboard'
import { sports, sportPositions } from '@/lib/onboarding'
import type { GuardianDashboardData, GuardianLinkedAthlete } from '@/lib/supabase/dashboard-data'

function LinkedAthlete({ athlete }: { athlete: GuardianLinkedAthlete }) {
    const { profile, privateDetails } = athlete
    return (
        <article className="rounded-xl border border-foreground/10 bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="eyebrow">Approved link</p>
                    <h3 className="mt-2 text-xl font-black uppercase tracking-tight">{athlete.athleteName}</h3>
                    {profile ? (
                        <p className="mt-1 text-sm text-foreground/60">
                            {maybeLabel(sports, profile.sport)} · {maybeLabel(sportPositions[profile.sport] ?? [], profile.primary_position)} · {profile.region}
                        </p>
                    ) : (
                        <p className="mt-1 text-sm text-foreground/60">The athlete has not saved a profile yet.</p>
                    )}
                </div>
                <StatusPill label={statusLabelFor(athlete.athleteStatus)} tone={statusTone(athlete.athleteStatus)} />
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-foreground/45">Safeguarding details</p>
                    <div className="mt-2">
                        <FieldGrid
                            fields={[
                                { label: 'Date of birth', value: privateDetails ? formatShortDate(privateDetails.date_of_birth) : 'Not recorded' },
                                { label: 'District', value: privateDetails?.district ?? 'Not recorded' },
                                { label: 'Community', value: privateDetails?.community ?? 'Not recorded' },
                                { label: 'School', value: privateDetails?.school ?? 'Not recorded' },
                            ]}
                        />
                    </div>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-foreground/45">Delegated consent</p>
                    <div className="mt-2">
                        <ConsentPanel
                            states={athlete.consentStates}
                            required={guardianDelegatedConsentTypes}
                            optional={['profile_discovery']}
                            emptyMessage="No delegated consent has been recorded for this athlete yet. Record it from the guardian link page."
                        />
                    </div>
                </div>
            </div>
        </article>
    )
}

export function GuardianDashboard({ data }: { data: GuardianDashboardData }) {
    const nextSteps: { label: string; description: string; href: string }[] = []
    if (data.missing.length) {
        nextSteps.push({
            label: 'Complete your guardian profile',
            description: `Still required: ${data.missing.join('; ')}.`,
            href: '/account/onboarding',
        })
    }
    nextSteps.push({
        label: 'Player links and consent',
        description: 'Claim an invitation, review link state, and record delegated consent.',
        href: '/account/guardian-approval',
    })
    nextSteps.push({
        label: 'Upcoming events',
        description: 'See the calendar of scout days and community sessions.',
        href: '/events',
    })

    return (
        <SiteShell current="/guardian">
            <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
                <DashboardHeader
                    eyebrow="Guardian dashboard"
                    title="Stay close to every milestone."
                    intro="This view shows the athletes you are linked to, their safeguarding details, and the consent decisions recorded in their name."
                    avatarUrl={data.photoUrl}
                    secondary={(
                        <a href="/events" className="flex items-center gap-2 rounded-md bg-[#F4D03F] px-5 py-3 font-bold text-[#172219]">
                            View events <CalendarDays className="size-4" aria-hidden="true" />
                        </a>
                    )}
                />

                <RequirementList missing={data.missing} />

                {!data.profile ? (
                    <EmptyPanel
                        title="No guardian profile yet"
                        description="Your account has no saved guardian profile. Complete onboarding to activate this dashboard."
                        actionHref="/account/onboarding"
                        actionLabel="Complete onboarding"
                    />
                ) : (
                    <>
                        <StatGrid>
                            <StatCard label="Account review" value={statusLabelFor(data.accountStatus)} hint="Approval is required before delegated consent is accepted." />
                            <StatCard label="Approved links" value={String(data.approvedLinks.length)} hint="Athletes who approved your link request." />
                            <StatCard label="Other requests" value={String(data.otherLinks.length)} hint="Pending, rejected or revoked links." />
                            <StatCard label="Guardian profile" value={data.missing.length ? 'Incomplete' : 'Complete'} hint="Profile completion never changes account review." />
                        </StatGrid>

                        {!data.reviewApproved && (
                            <div className="mt-5">
                                <DashboardNotice tone="attention">
                                    Your account review is {statusLabelFor(data.accountStatus)}. You can see link state, but linked athlete details and delegated consent stay locked until an active admin approves your account.
                                </DashboardNotice>
                            </div>
                        )}

                        <section className="mt-6">
                            <Card title="Guardian profile">
                                <FieldGrid
                                    fields={[
                                        { label: 'Relationship', value: humanizeToken(data.profile.relationship) },
                                        { label: 'Region', value: data.profile.region },
                                        { label: 'Phone', value: data.profile.phone },
                                        { label: 'Secondary phone', value: data.profile.secondary_phone ?? 'Not recorded' },
                                        { label: 'Address', value: data.profile.address },
                                        { label: 'Emergency contact', value: data.profile.emergency_contact_name },
                                        { label: 'Emergency phone', value: data.profile.emergency_contact_phone },
                                        { label: 'Medical notes', value: data.profile.medical_notes ?? 'Not recorded' },
                                    ]}
                                />
                            </Card>
                        </section>
                    </>
                )}

                <section className="mt-6 flex flex-col gap-5">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Linked athletes · {data.approvedLinks.length}</h2>
                    {data.reviewApproved && data.approvedLinks.length ? (
                        data.approvedLinks.map(athlete => <LinkedAthlete key={athlete.link.id} athlete={athlete} />)
                    ) : (
                        <p className="rounded-xl border border-dashed border-foreground/20 bg-card p-6 text-sm leading-6 text-foreground/60">
                            {data.reviewApproved
                                ? 'No athlete has approved a link from your account yet. Claim a player invitation to send a request.'
                                : 'Approved athlete links and their consent history become visible after your account review is approved.'}
                        </p>
                    )}
                </section>

                {data.otherLinks.length > 0 && (
                    <section className="mt-6">
                        <Card title="Other link requests">
                            <ul className="flex flex-col gap-3">
                                {data.otherLinks.map(athlete => (
                                    <li key={athlete.link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-foreground/10 p-4">
                                        <span className="text-sm font-semibold">Requested {formatShortDate(athlete.link.requested_at)}</span>
                                        <StatusPill label={humanizeToken(athlete.link.status)} tone={statusTone(athlete.link.status)} />
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </section>
                )}

                <section className="mt-6">
                    <Card title="Next steps">
                        <NextSteps items={nextSteps} />
                    </Card>
                </section>
            </main>
        </SiteShell>
    )
}
