import type { ConsentState } from './dashboard'
import type {
    AccountProfile,
    AdminGuardianReviewRecord,
    AdminScoutReviewRecord,
    ConsentType,
    MediaStatus,
    MediaType,
    MediaVisibility,
    PlayerProfileRecord,
    ProfileRole,
    ScoutInterestRecord,
} from './supabase/contracts'

export interface AdminProfileReviewField {
    label: string
    value: string
    href?: string
}

export interface AdminProfileReviewMedia {
    id: string
    label: string
    mediaType: Exclude<MediaType, 'identity_document'>
    status: MediaStatus
    visibility: MediaVisibility
    contentType: string
    createdAt: string
    deliveryUrl: string | null
}

export interface AdminProfileReviewStep {
    id: string
    title: string
    description: string
    fields?: AdminProfileReviewField[]
    consents?: ConsentState[]
    media?: AdminProfileReviewMedia[]
    emptyMessage: string
}

export interface AdminProfileSubmissionReview {
    displayName: string
    role: ProfileRole
    roleLabel: string
    accountStatus: string
    submittedAt: string
    steps: AdminProfileReviewStep[]
    dataWarnings: string[]
    notSubmittedMessage?: string
}

export type AdminPlayerReviewSource = Pick<
    PlayerProfileRecord,
    | 'sport'
    | 'region'
    | 'primary_position'
    | 'secondary_position'
    | 'dominant_side'
    | 'experience_level'
    | 'years_playing'
    | 'previous_club'
    | 'bio'
    | 'goals'
    | 'highlight_url'
    | 'achievements'
> & { isMinor: boolean | null }

export interface ReviewMediaCandidate {
    mediaType: string
    status: MediaStatus
    contentType: string
    isCurrent: boolean
    deletedAt: string | null
}

const roleLabels: Record<ProfileRole, string> = {
    player: 'Athlete',
    scout: 'Scout',
    guardian: 'Guardian',
    admin: 'Administrator',
}

const statusLabels: Record<string, string> = {
    pending: 'Pending review',
    reviewed: 'Reviewed',
    approved: 'Approved',
    active: 'Active',
    rejected: 'Rejected',
}

const interestLabels: Record<ScoutInterestRecord['interest_type'], string> = {
    sport: 'Sports covered',
    position: 'Positions of interest',
    age_band: 'Age bands',
    region: 'Regions covered',
}

const consentOrder: ConsentType[] = [
    'participation', 'media', 'safeguarding', 'financial', 'profile_discovery',
    'scout_code', 'background_check', 'no_contact_policy',
]

function humanize(value: string): string {
    return value.replaceAll('-', ' ').replaceAll('_', ' ')
}

function accountName(profile: Pick<AccountProfile, 'first_name' | 'last_name' | 'role'>): string {
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
    return name || `Unnamed ${roleLabels[profile.role].toLowerCase()}`
}

function addField(fields: AdminProfileReviewField[], label: string, value: string | number | null | undefined, humanized = false): void {
    if (value === null || value === undefined || value === '') return
    fields.push({ label, value: humanized && typeof value === 'string' ? humanize(value) : String(value) })
}

function safeWebUrl(value: string | null): string | undefined {
    if (!value) return undefined
    try {
        const url = new URL(value)
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined
    } catch {
        return undefined
    }
}

function accountStatus(status: string): string {
    return statusLabels[status] ?? humanize(status)
}

export function eligibleProfileReviewMedia<T extends ReviewMediaCandidate>(items: T[]): T[] {
    return items.filter(item =>
        (item.mediaType === 'profile_photo' || item.mediaType === 'action_photo')
        && item.isCurrent
        && item.deletedAt === null
        && item.status !== 'rejected'
        && ['image/jpeg', 'image/png', 'image/webp'].includes(item.contentType),
    )
}

export function buildAdminProfileSubmissionReview(input: {
    account: Pick<AccountProfile, 'role' | 'status' | 'first_name' | 'last_name' | 'created_at'>
    player?: AdminPlayerReviewSource | null
    scout?: AdminScoutReviewRecord | null
    scoutInterests?: ScoutInterestRecord[]
    guardian?: AdminGuardianReviewRecord | null
    consentStates?: ConsentState[]
    media?: AdminProfileReviewMedia[]
    dataWarnings?: string[]
}): AdminProfileSubmissionReview {
    const { account } = input
    const consentStates = [...(input.consentStates ?? [])].sort((a, b) =>
        consentOrder.indexOf(a.consentType) - consentOrder.indexOf(b.consentType),
    )
    const media = input.media ?? []
    const steps: AdminProfileReviewStep[] = []

    if (account.role === 'player' && input.player) {
        const athleteFields: AdminProfileReviewField[] = []
        addField(athleteFields, 'Sport', input.player.sport, true)
        addField(athleteFields, 'Region', input.player.region)
        addField(athleteFields, 'Primary position', input.player.primary_position, true)
        addField(athleteFields, 'Secondary position', input.player.secondary_position, true)
        addField(athleteFields, 'Dominant side', input.player.dominant_side, true)
        addField(athleteFields, 'Experience level', input.player.experience_level, true)
        addField(athleteFields, 'Years playing', input.player.years_playing === null ? null : `${input.player.years_playing} years`)
        addField(athleteFields, 'Previous club or team', input.player.previous_club)
        if (input.player.isMinor !== null) {
            addField(athleteFields, 'Safeguarding age band', input.player.isMinor ? 'Under 18' : '18 or older')
        }

        const storyFields: AdminProfileReviewField[] = []
        addField(storyFields, 'About the athlete', input.player.bio)
        addField(storyFields, 'Development goals', input.player.goals)
        addField(storyFields, 'Key achievements', input.player.achievements)
        if (input.player.highlight_url) {
            const highlight: AdminProfileReviewField = { label: 'Highlight video', value: input.player.highlight_url }
            const href = safeWebUrl(input.player.highlight_url)
            if (href) highlight.href = href
            storyFields.push(highlight)
        }

        steps.push(
            { id: 'athlete-profile', title: 'Athlete profile', description: 'Sport, playing background, and safeguarding context submitted for review.', fields: athleteFields, emptyMessage: 'No athlete profile details were submitted.' },
            { id: 'story-and-goals', title: 'Story and goals', description: 'The athlete’s own description, development goals, and supporting highlights.', fields: storyFields, emptyMessage: 'No biography, goals, achievements, or highlight link were submitted.' },
            { id: 'consents', title: 'Consent history', description: 'Latest recorded decisions for this account. Under-18 athlete consents may be recorded by an approved guardian.', consents: consentStates, emptyMessage: 'No consent decisions have been recorded.' },
            { id: 'submitted-images', title: 'Submitted images', description: 'Current profile and action photos only. Identity documents remain in the separate media-moderation workspace.', media, emptyMessage: 'No current profile or action photos are available.' },
        )
    } else if (account.role === 'scout' && input.scout) {
        const professionalFields: AdminProfileReviewField[] = []
        addField(professionalFields, 'Nationality', input.scout.nationality)
        addField(professionalFields, 'Region', input.scout.region)
        addField(professionalFields, 'Organisation', input.scout.organisation)
        addField(professionalFields, 'Professional role', input.scout.scout_role, true)
        addField(professionalFields, 'Affiliation', input.scout.affiliation_type, true)
        addField(professionalFields, 'Years of experience', input.scout.years_experience)
        addField(professionalFields, 'Independent vetting', accountStatus(input.scout.vetting_status))

        const interestGroups = new Map<ScoutInterestRecord['interest_type'], string[]>()
        for (const interest of input.scoutInterests ?? []) {
            const values = interestGroups.get(interest.interest_type) ?? []
            values.push(humanize(interest.interest_value))
            interestGroups.set(interest.interest_type, values)
        }
        const interestFields = [...interestGroups.entries()].map(([type, values]) => ({
            label: interestLabels[type],
            value: [...new Set(values)].join(', '),
        }))
        const scoutConsents = consentStates.filter(state => consentOrder.slice(5).includes(state.consentType))

        steps.push(
            { id: 'professional-profile', title: 'Professional profile', description: 'The scout’s organisation, role, affiliation, and experience submitted for review.', fields: professionalFields, emptyMessage: 'No professional profile details were submitted.' },
            { id: 'scouting-interests', title: 'Scouting interests', description: 'The sports, positions, age bands, and regions the scout selected.', fields: interestFields, emptyMessage: 'No scouting interests were submitted.' },
            { id: 'safeguarding-consents', title: 'Safeguarding consents', description: 'Latest safeguarding decisions recorded for this scout account.', consents: scoutConsents, emptyMessage: 'No safeguarding consents have been recorded.' },
            { id: 'submitted-images', title: 'Profile image', description: 'Current profile photo only. Government identity documents remain in the separate media-moderation workspace.', media: media.filter(item => item.mediaType === 'profile_photo'), emptyMessage: 'No current profile photo is available.' },
        )
    } else if (account.role === 'guardian' && input.guardian) {
        const guardianFields: AdminProfileReviewField[] = []
        addField(guardianFields, 'Relationship to athlete', input.guardian.relationship, true)
        addField(guardianFields, 'Region', input.guardian.region)
        steps.push(
            { id: 'guardian-profile', title: 'Guardian profile', description: 'Non-contact profile details submitted for safeguarding review.', fields: guardianFields, emptyMessage: 'No guardian profile details were submitted.' },
            { id: 'submitted-images', title: 'Profile image', description: 'Current profile photo only.', media: media.filter(item => item.mediaType === 'profile_photo'), emptyMessage: 'No current profile photo is available.' },
        )
    }

    const hasSubmission = steps.length > 0
    return {
        displayName: accountName(account),
        role: account.role,
        roleLabel: roleLabels[account.role],
        accountStatus: accountStatus(account.status),
        submittedAt: account.created_at,
        steps,
        dataWarnings: input.dataWarnings ?? [],
        ...(!hasSubmission ? {
            notSubmittedMessage: account.role === 'admin'
                ? 'Administrator accounts do not have a player, scout, or guardian onboarding submission.'
                : 'No completed role-specific onboarding profile is available for this account yet.'
        } : {}),
    }
}
