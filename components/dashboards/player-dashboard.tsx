import { CalendarDays } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import {
    Card,
    DashboardHeader,
    DashboardNotice,
    EmptyPanel,
    FieldGrid,
    ConsentPanel,
    NextSteps,
    RequirementList,
    StatCard,
    StatGrid,
    maybeLabel,
    statusLabelFor,
} from '@/components/dashboards/shared'
import { consentDecision, formatShortDate, humanizeToken, playerSelfConsentTypes } from '@/lib/dashboard'
import { sports, sportPositions } from '@/lib/onboarding'
import type { PlayerDashboardData } from '@/lib/supabase/dashboard-data'

export function PlayerDashboard({ data }: { data: PlayerDashboardData }) {
    const { profile, privateDetails, isMinor } = data
    const reviewReady = data.accountStatus === 'approved' || data.accountStatus === 'active'
    const positions = profile ? sportPositions[profile.sport] ?? [] : []
    const discovery = consentDecision(data.consentStates, 'profile_discovery')
    const grantedConsents = playerSelfConsentTypes.filter(type => consentDecision(data.consentStates, type) === 'granted').length

    const nextSteps: { label: string; description: string; href: string }[] = []
    if (data.missing.length) {
        nextSteps.push({
            label: 'Complete your profile',
            description: `Still required: ${data.missing.join('; ')}.`,
            href: '/account/onboarding',
        })
    }
    nextSteps.push({
        label: 'Review your profile and consents',
        description: 'Update saved details or record new consent decisions.',
        href: '/account/onboarding',
    })
    if (isMinor) {
        nextSteps.push({
            label: 'Guardian requests and status',
            description: 'Track the approved guardian link and delegated consent.',
            href: '/account/guardian-approval',
        })
    }
    nextSteps.push({
        label: 'Upcoming events',
        description: 'See scout days and community sessions on the calendar.',
        href: '/events',
    })

    return (
        <SiteShell current="/player">
            <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
                <DashboardHeader
                    eyebrow="Athlete dashboard"
                    title="Your pathway, in motion."
                    intro="This view is built from your saved athlete profile, private details and consent history. Only you can read it."
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
                        title="No athlete profile yet"
                        description="Your account has no saved athlete profile. Complete onboarding to activate this dashboard."
                        actionHref="/account/onboarding"
                        actionLabel="Complete onboarding"
                    />
                ) : (
                    <>
                        <StatGrid>
                            <StatCard label="Account review" value={statusLabelFor(data.accountStatus)} hint="Set by the Demo Day team, not by profile completion." />
                            <StatCard
                                label="Discoverability"
                                value={discovery === 'granted' ? 'Shared with scouts' : discovery === 'withdrawn' ? 'Not shared' : 'Not set'}
                                hint="Vetted scouts only see your allowlisted profile."
                            />
                            <StatCard
                                label="Required consents"
                                value={isMinor ? 'Guardian-managed' : `${grantedConsents} / ${playerSelfConsentTypes.length}`}
                                hint={isMinor ? 'An approved guardian records these consents.' : 'Participation, media, safeguarding and financial.'}
                            />
                            <StatCard
                                label="Age group"
                                value={isMinor ? 'Under 18' : '18 or older'}
                                hint={isMinor ? 'Guardian approval is required for dashboard access.' : 'Guardian approval is not required.'}
                            />
                        </StatGrid>

                        {!reviewReady && (
                            <div className="mt-5">
                                <DashboardNotice tone="attention">
                                    Your account review is {statusLabelFor(data.accountStatus)}. Profile completion never approves your account.
                                </DashboardNotice>
                            </div>
                        )}

                        {isMinor && (
                            <div className="mt-5">
                                <DashboardNotice tone={data.guardianApprovalComplete ? 'positive' : 'pending'}>
                                    {data.guardianApprovalComplete
                                        ? 'Your approved guardian relationship and delegated consents are current.'
                                        : 'Under-18 access also needs an approved guardian link and current guardian-attributed participation, media, safeguarding and financial consents.'}
                                </DashboardNotice>
                            </div>
                        )}

                        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
                            <Card title="Athlete profile">
                                <FieldGrid
                                    fields={[
                                        { label: 'Sport', value: maybeLabel(sports, profile.sport) },
                                        { label: 'Region', value: profile.region },
                                        { label: 'Primary position', value: maybeLabel(positions, profile.primary_position) },
                                        { label: 'Secondary position', value: maybeLabel(positions, profile.secondary_position) },
                                        { label: 'Dominant side', value: humanizeToken(profile.dominant_side) },
                                        { label: 'Experience level', value: humanizeToken(profile.experience_level) },
                                        { label: 'Years playing', value: profile.years_playing === null ? 'Not recorded' : String(profile.years_playing) },
                                        { label: 'Previous club', value: profile.previous_club ?? 'Not recorded' },
                                        { label: 'Bio', value: profile.bio ?? 'Not recorded' },
                                        { label: 'Goals', value: profile.goals ?? 'Not recorded' },
                                        { label: 'Highlight reel', value: profile.highlight_url ?? 'Not recorded' },
                                        { label: 'Achievements', value: profile.achievements ?? 'Not recorded' },
                                    ]}
                                />
                            </Card>

                            <div className="flex flex-col gap-6">
                                <Card title="Private athlete details">
                                    <FieldGrid
                                        fields={[
                                            { label: 'Date of birth', value: privateDetails ? formatShortDate(privateDetails.date_of_birth) : 'Not recorded' },
                                            { label: 'Gender', value: privateDetails ? humanizeToken(privateDetails.gender) : 'Not recorded' },
                                            { label: 'District', value: privateDetails?.district ?? 'Not recorded' },
                                            { label: 'Community', value: privateDetails?.community ?? 'Not recorded' },
                                            { label: 'School', value: privateDetails?.school ?? 'Not recorded' },
                                            { label: 'Jersey number', value: privateDetails?.jersey_number === null || privateDetails?.jersey_number === undefined ? 'Not recorded' : `#${privateDetails.jersey_number}` },
                                            { label: 'Height', value: privateDetails?.height_cm === null || privateDetails?.height_cm === undefined ? 'Not recorded' : `${privateDetails.height_cm} cm` },
                                            { label: 'Weight', value: privateDetails?.weight_kg === null || privateDetails?.weight_kg === undefined ? 'Not recorded' : `${privateDetails.weight_kg} kg` },
                                        ]}
                                    />
                                </Card>

                                <Card title="Consent decisions">
                                    <ConsentPanel
                                        states={data.consentStates}
                                        required={isMinor ? [] : playerSelfConsentTypes}
                                        optional={['profile_discovery']}
                                        emptyMessage={isMinor
                                            ? 'Consents for an under-18 athlete are recorded by the approved guardian from the guardian link page.'
                                            : 'No consent decisions have been recorded yet.'}
                                    />
                                </Card>
                            </div>
                        </div>

                        {data.missingConsents.length > 0 && (
                            <div className="mt-5">
                                <DashboardNotice tone="attention">
                                    Missing required consent: {data.missingConsents.map(humanizeToken).join(', ')}.
                                </DashboardNotice>
                            </div>
                        )}
                    </>
                )}

                <section className="mt-12">
                    <Card title="Next steps">
                        <NextSteps items={nextSteps} />
                    </Card>
                </section>
            </main>
        </SiteShell>
    )
}
