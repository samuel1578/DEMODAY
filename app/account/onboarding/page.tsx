import { redirect } from 'next/navigation'
import { ServerOnboardingForm, type OnboardingRole } from '@/components/onboarding/server-onboarding-form'
import { SiteShell } from '@/components/site-shell'
import { createClient } from '@/lib/supabase/server'

const inviteTokenPattern = /^[A-Za-z0-9_-]{43}$/

function dateString(value: unknown): string {
    if (typeof value !== 'string') return ''
    return value.slice(0, 10)
}

function stringValue(value: unknown): string {
    if (value === null || value === undefined) return ''
    return String(value)
}

export default async function AccountOnboardingPage({
    searchParams,
}: {
    searchParams: Promise<{ invite?: string }>
}) {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) redirect('/sign-in')
    if (!authData.user.email_confirmed_at) redirect('/account/pending')

    const { data: account, error: accountError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', authData.user.id)
        .maybeSingle()
    if (accountError || !account) redirect('/account/pending')
    if (!['player', 'guardian', 'scout'].includes(account.role)) {
        redirect(account.role === 'admin' ? '/admin' : '/account/pending')
    }
    const role = account.role as OnboardingRole
    const query = await searchParams
    const inviteToken = role === 'guardian' && query.invite && inviteTokenPattern.test(query.invite)
        ? query.invite
        : undefined
    const initialValues: Record<string, string | string[]> = {}

    if (role === 'player') {
        const [profileResult, privateResult] = await Promise.all([
            supabase.from('player_profiles')
                .select('sport,region,primary_position,secondary_position,dominant_side,experience_level,years_playing,previous_club,bio,goals,highlight_url,achievements')
                .eq('user_id', authData.user.id).maybeSingle(),
            supabase.from('player_private_details')
                .select('date_of_birth,gender,district,community,school,jersey_number,height_cm,weight_kg')
                .eq('user_id', authData.user.id).maybeSingle(),
        ])
        const profile = profileResult.data
        const details = privateResult.data
        if (profile) Object.assign(initialValues, {
            sport: stringValue(profile.sport),
            region: stringValue(profile.region),
            primaryPosition: stringValue(profile.primary_position),
            secondaryPosition: stringValue(profile.secondary_position),
            dominantSide: stringValue(profile.dominant_side),
            experienceLevel: stringValue(profile.experience_level),
            yearsPlaying: stringValue(profile.years_playing),
            previousClub: stringValue(profile.previous_club),
            bio: stringValue(profile.bio),
            goals: stringValue(profile.goals),
            highlightUrl: stringValue(profile.highlight_url),
            achievements: stringValue(profile.achievements),
        })
        if (details) Object.assign(initialValues, {
            dateOfBirth: dateString(details.date_of_birth),
            gender: stringValue(details.gender),
            district: stringValue(details.district),
            community: stringValue(details.community),
            school: stringValue(details.school),
            jerseyNumber: stringValue(details.jersey_number),
            heightCm: stringValue(details.height_cm),
            weightKg: stringValue(details.weight_kg),
        })
    } else if (role === 'scout') {
        const [profileResult, interestsResult] = await Promise.all([
            supabase.from('scout_profiles')
                .select('date_of_birth,phone,nationality,region,organisation,scout_role,affiliation_type,years_experience,reference_name,reference_contact')
                .eq('user_id', authData.user.id).maybeSingle(),
            supabase.from('scout_interests')
                .select('interest_type,interest_value')
                .eq('user_id', authData.user.id),
        ])
        const profile = profileResult.data
        if (profile) Object.assign(initialValues, {
            dateOfBirth: dateString(profile.date_of_birth),
            phone: stringValue(profile.phone),
            nationality: stringValue(profile.nationality),
            region: stringValue(profile.region),
            organisation: stringValue(profile.organisation),
            scoutRole: stringValue(profile.scout_role),
            affiliationType: stringValue(profile.affiliation_type),
            yearsExperience: stringValue(profile.years_experience),
            referenceName: stringValue(profile.reference_name),
            referenceContact: stringValue(profile.reference_contact),
        })
        for (const interest of interestsResult.data ?? []) {
            const key = interest.interest_type === 'age_band' ? 'ageBands'
                : interest.interest_type === 'region' ? 'regions'
                    : interest.interest_type === 'position' ? 'positions' : 'sports'
            const existing = Array.isArray(initialValues[key]) ? initialValues[key] as string[] : []
            initialValues[key] = [...existing, interest.interest_value]
        }
    } else {
        const { data: profile } = await supabase.from('guardian_profiles')
            .select('relationship,phone,secondary_phone,region,address,emergency_contact_name,emergency_contact_phone,medical_notes')
            .eq('user_id', authData.user.id).maybeSingle()
        if (profile) Object.assign(initialValues, {
            relationship: stringValue(profile.relationship),
            phone: stringValue(profile.phone),
            secondaryPhone: stringValue(profile.secondary_phone),
            region: stringValue(profile.region),
            address: stringValue(profile.address),
            emergencyContactName: stringValue(profile.emergency_contact_name),
            emergencyContactPhone: stringValue(profile.emergency_contact_phone),
            medicalNotes: stringValue(profile.medical_notes),
        })
    }

    return (
        <SiteShell current="/account/pending">
            <main className="mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-16">
                <p className="eyebrow">Account setup · {role}</p>
                <h1 className="display-title mt-4">Complete your {role} profile.</h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/60">
                    Your saved account role controls this form. Onboarding stores role-specific profile details and append-only consent records; it never changes account review or scout vetting status.
                </p>
                <div className="mt-9">
                    <ServerOnboardingForm role={role} initialValues={initialValues} inviteToken={inviteToken} />
                </div>
            </main>
        </SiteShell>
    )
}
