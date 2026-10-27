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
    maybeLabel,
    statusLabelFor,
} from '@/components/dashboards/shared'
import { humanizeToken, scoutConsentTypes } from '@/lib/dashboard'
import { sports, sportPositions } from '@/lib/onboarding'
import type { ScoutDashboardData } from '@/lib/supabase/dashboard-data'
import type { ScoutInterestRecord } from '@/lib/supabase/contracts'

const ageBandLabels: Record<string, string> = {
    u14: 'Under 14',
    u16: 'Under 16',
    u18: 'Under 18',
    u21: 'Under 21',
    senior: 'Senior',
}

const positionOptions = Object.values(sportPositions).flatMap(options => options)

function valuesFor(interests: ScoutInterestRecord[], type: ScoutInterestRecord['interest_type']): string[] {
    return interests.filter(interest => interest.interest_type === type).map(interest => interest.interest_value)
}

function Chips({ title, values, label }: { title: string; values: string[]; label: (value: string) => string }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wider text-foreground/45">{title}</p>
            {values.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                    {values.map(value => (
                        <span key={value} className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold">{label(value)}</span>
                    ))}
                </div>
            ) : (
                <p className="mt-1 text-sm text-foreground/50">None saved.</p>
            )}
        </div>
    )
}

export function ScoutDashboard({ data }: { data: ScoutDashboardData }) {
    const { profile } = data
    const vettingApproved = profile?.vetting_status === 'approved' || profile?.vetting_status === 'active'
    const reviewReady = data.accountStatus === 'approved' || data.accountStatus === 'active'

    const nextSteps: { label: string; description: string; href: string }[] = []
    if (data.missing.length) {
        nextSteps.push({
            label: 'Complete your application',
            description: `Still required: ${data.missing.join('; ')}.`,
            href: '/account/onboarding',
        })
    }
    nextSteps.push({
        label: 'Update scout profile and interests',
        description: 'Keep your organisation details, coverage and safeguarding consents current.',
        href: '/account/onboarding',
    })
    nextSteps.push({
        label: 'Upcoming events',
        description: 'See scout days where opted-in athletes are assessed.',
        href: '/events',
    })

    return (
        <SiteShell current="/scout">
            <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
                <DashboardHeader
                    eyebrow="Scout dashboard"
                    title="Find the signal in the noise."
                    intro="Your discovery view only ever shows opted-in athletes whose profile and account review are approved. Private details and full surnames stay out of this workspace."
                    avatarUrl={data.photoUrl}
                    secondary={(
                        <a href="/events" className="flex items-center gap-2 rounded-md bg-[#F4D03F] px-5 py-3 font-bold text-[#172219]">
                            View events <CalendarDays className="size-4" aria-hidden="true" />
                        </a>
                    )}
                />

                <RequirementList missing={data.missing} />

                {!profile ? (
                    <EmptyPanel
                        title="No scout profile yet"
                        description="Your account has no saved scout application. Complete onboarding to activate this dashboard."
                        actionHref="/account/onboarding"
                        actionLabel="Complete onboarding"
                    />
                ) : (
                    <>
                        <StatGrid>
                            <StatCard label="Account review" value={statusLabelFor(data.accountStatus)} hint="Independent of the vetting decision." />
                            <StatCard label="Scout vetting" value={statusLabelFor(profile.vetting_status)} hint="Set by the Demo Day team using the guarded RPC." />
                            <StatCard label="Discoverable athletes" value={String(data.discoverablePlayers.length)} hint="Only approved, opted-in athletes appear here." />
                            <StatCard
                                label="Safeguarding consents"
                                value={`${scoutConsentTypes.length - data.missingConsents.length} / ${scoutConsentTypes.length}`}
                                hint="Scout code, background check and no-contact policy."
                            />
                        </StatGrid>

                        {(!reviewReady || !vettingApproved) && (
                            <div className="mt-5">
                                <DashboardNotice tone="attention">
                                    {!reviewReady
                                        ? `Your account review is ${statusLabelFor(data.accountStatus)}.`
                                        : `Your scout vetting is ${statusLabelFor(profile.vetting_status)}.`}
                                    {' '}Discovery stays empty until both the account review and the vetting decision are approved.
                                </DashboardNotice>
                            </div>
                        )}

                        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
                            <Card title="Scout profile">
                                <FieldGrid
                                    fields={[
                                        { label: 'Organisation', value: profile.organisation },
                                        { label: 'Scout role', value: humanizeToken(profile.scout_role) },
                                        { label: 'Affiliation', value: humanizeToken(profile.affiliation_type) },
                                        { label: 'Region', value: profile.region ?? 'Not recorded' },
                                        { label: 'Nationality', value: profile.nationality ?? 'Not recorded' },
                                        { label: 'Years of experience', value: profile.years_experience === null ? 'Not recorded' : String(profile.years_experience) },
                                        { label: 'Reference', value: profile.reference_name },
                                        { label: 'Reference contact', value: profile.reference_contact },
                                    ]}
                                />
                            </Card>

                            <div className="flex flex-col gap-6">
                                <Card title="Saved interests">
                                    <div className="flex flex-col gap-5">
                                        <Chips title="Sports" values={valuesFor(data.interests, 'sport')} label={value => maybeLabel(sports, value)} />
                                        <Chips title="Positions" values={valuesFor(data.interests, 'position')} label={value => maybeLabel(positionOptions, value)} />
                                        <Chips title="Age bands" values={valuesFor(data.interests, 'age_band')} label={value => ageBandLabels[value] ?? humanizeToken(value)} />
                                        <Chips title="Regions covered" values={valuesFor(data.interests, 'region')} label={value => value} />
                                    </div>
                                </Card>

                                <Card title="Safeguarding consents">
                                    <ConsentPanel
                                        states={data.consentStates}
                                        required={scoutConsentTypes}
                                        emptyMessage="No safeguarding consents have been recorded yet."
                                    />
                                </Card>
                            </div>
                        </div>
                    </>
                )}

                <section className="mt-12">
                    <Card title={`Opted-in talent · ${data.discoverablePlayers.length}`}>
                        {data.discoverablePlayers.length ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {data.discoverablePlayers.map(player => (
                                    <article key={player.user_id} className="rounded-xl border border-foreground/10 bg-background p-5">
                                        <h3 className="text-lg font-black uppercase tracking-tight">
                                            {[player.first_name, player.last_initial ? `${player.last_initial}.` : null].filter(Boolean).join(' ') || 'Athlete'}
                                        </h3>
                                        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[#E67E22]">{maybeLabel(sports, player.sport)}</p>
                                        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <dt className="text-[10px] uppercase tracking-wider text-foreground/45">Position</dt>
                                                <dd className="mt-0.5 font-semibold">{maybeLabel(sportPositions[player.sport] ?? [], player.primary_position)}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] uppercase tracking-wider text-foreground/45">Region</dt>
                                                <dd className="mt-0.5 font-semibold">{player.region}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] uppercase tracking-wider text-foreground/45">Experience</dt>
                                                <dd className="mt-0.5 font-semibold">{humanizeToken(player.experience_level)}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] uppercase tracking-wider text-foreground/45">Previous club</dt>
                                                <dd className="mt-0.5 font-semibold">{player.previous_club ?? 'Not recorded'}</dd>
                                            </div>
                                        </dl>
                                        {player.bio ? <p className="mt-4 text-sm leading-6 text-foreground/60">{player.bio}</p> : null}
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm leading-6 text-foreground/60">
                                No opted-in athletes are available yet. Athletes appear here after their account review is approved and they grant scout discovery consent.
                            </p>
                        )}
                    </Card>
                </section>

                <section className="mt-6">
                    <Card title="Next steps">
                        <NextSteps items={nextSteps} />
                    </Card>
                </section>
            </main>
        </SiteShell>
    )
}
