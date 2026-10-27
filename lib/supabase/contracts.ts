export type ProfileRole = 'player' | 'scout' | 'guardian' | 'admin'
export type ProfileStatus = 'pending' | 'approved' | 'rejected' | 'reviewed' | 'active'
export type ConsentType =
    | 'participation'
    | 'media'
    | 'safeguarding'
    | 'financial'
    | 'scout_code'
    | 'background_check'
    | 'no_contact_policy'
    | 'profile_discovery'
export type ConsentDecision = 'granted' | 'withdrawn'
export type GuardianLinkStatus = 'pending' | 'approved' | 'rejected' | 'revoked' | 'expired'
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

export interface AccountProfile {
    user_id: string
    role: ProfileRole
    status: ProfileStatus
    first_name: string | null
    last_name: string | null
    created_at: string
    updated_at: string
}

/** Fields in public.player_profiles; identifying athlete details live separately. */
export interface PlayerProfileRecord {
    user_id: string
    sport: string
    region: string
    primary_position: string
    secondary_position: string | null
    dominant_side: 'right' | 'left' | 'both'
    experience_level: 'park' | 'school' | 'district' | 'academy' | 'none'
    years_playing: number | null
    previous_club: string | null
    bio: string | null
    goals: string | null
    highlight_url: string | null
    achievements: string | null
    created_at: string
    updated_at: string
}

/** Sensitive/minor-related fields, visible only to the athlete, linked guardian, or admin. */
export interface PlayerPrivateDetails {
    user_id: string
    date_of_birth: string
    gender: 'female' | 'male'
    district: string
    community: string | null
    school: string | null
    jersey_number: number | null
    height_cm: number | null
    weight_kg: number | null
    created_at: string
    updated_at: string
}

export interface PlayerProfileBundle {
    profile: PlayerProfileRecord
    privateDetails: PlayerPrivateDetails | null
}

/** Allowlisted scout-facing view; never add DOB, contact, address, or full surname here. */
export interface ScoutDiscoverablePlayer {
    user_id: string
    first_name: string | null
    last_initial: string | null
    sport: string
    region: string
    primary_position: string
    secondary_position: string | null
    dominant_side: 'right' | 'left' | 'both'
    experience_level: 'park' | 'school' | 'district' | 'academy' | 'none'
    years_playing: number | null
    previous_club: string | null
    bio: string | null
    goals: string | null
    highlight_url: string | null
    achievements: string | null
}

export interface ScoutInterestRecord {
    user_id: string
    interest_type: 'sport' | 'position' | 'age_band' | 'region'
    interest_value: string
}

/** Independent vetting decision for a scout profile; never self-writable. */
export interface ScoutVettingRecord {
    user_id: string
    vetting_status: ProfileStatus
}

export interface GuardianPlayerLink {
    id: string
    guardian_user_id: string
    player_user_id: string
    status: GuardianLinkStatus
    requested_at: string
    expires_at: string | null
    decided_at: string | null
    decided_by: string | null
    updated_at: string
}

export interface ScoutProfileRecord {
    user_id: string
    date_of_birth: string
    phone: string
    nationality: string | null
    region: string | null
    organisation: string
    scout_role: string
    affiliation_type: string
    years_experience: number | null
    reference_name: string
    reference_contact: string
    vetting_status: ProfileStatus
    created_at: string
    updated_at: string
}

export interface GuardianProfileRecord {
    user_id: string
    relationship: string
    phone: string
    secondary_phone: string | null
    region: string
    address: string
    emergency_contact_name: string
    emergency_contact_phone: string
    medical_notes: string | null
    created_at: string
    updated_at: string
}

export interface ConsentRecord {
    id: string
    actor_user_id: string
    subject_user_id: string
    consent_type: ConsentType
    decision: ConsentDecision
    consent_version: string
    recorded_at: string
    consent_revision: number
}

export interface EventRecord {
    id: string
    title: string
    description: string | null
    category: string
    location: string
    starts_at: string
    ends_at: string | null
    status: EventStatus
    is_spotlight: boolean
    created_by: string | null
    created_at: string
    updated_at: string
}

export type PublishedEvent = EventRecord

export interface EventMutationInput {
    title: string
    description: string | null
    category: string
    location: string
    starts_at: string
    ends_at: string | null
    status: EventStatus
    is_spotlight: boolean
}

export interface AuditLogEntry {
    id: string
    entity_type: 'profile' | 'scout_profile' | 'guardian_player_link' | 'consent_record' | 'event'
    entity_id: string
    action:
    | 'profile_status_changed'
    | 'scout_vetting_changed'
    | 'guardian_link_status_changed'
    | 'consent_recorded'
    | 'event_status_changed'
    actor_user_id: string | null
    old_status: string | null
    new_status: string | null
    metadata: Record<string, string | null>
    created_at: string
}

/** Shared result shape for the server-backed admin review actions. */
export type AdminReviewActionState = {
    status: 'idle' | 'error' | 'success'
    message?: string
}

export interface DemoDayServerDataContract {
    getAccountProfile(): Promise<AccountProfile | null>
    getPlayerProfile(): Promise<PlayerProfileBundle | null>
    getLinkedPlayerAccount(playerUserId: string): Promise<AccountProfile | null>
    getLinkedPlayerProfile(playerUserId: string): Promise<PlayerProfileBundle | null>
    getLinkedAthleteConsentHistory(playerUserId: string): Promise<ConsentRecord[]>
    getScoutProfile(): Promise<ScoutProfileRecord | null>
    getScoutInterests(): Promise<ScoutInterestRecord[]>
    getGuardianProfile(): Promise<GuardianProfileRecord | null>
    getGuardianPlayerLinks(): Promise<GuardianPlayerLink[]>
    getMyConsentHistory(): Promise<ConsentRecord[]>
    getScoutDiscoverablePlayers(): Promise<ScoutDiscoverablePlayer[]>
    getAdminEvents(): Promise<EventRecord[]>
    createEvent(input: EventMutationInput): Promise<EventRecord>
    updateEvent(eventId: string, input: Partial<EventMutationInput>): Promise<EventRecord>
    deleteEvent(eventId: string): Promise<void>
    getAdminAuditLog(limit?: number): Promise<AuditLogEntry[]>
    getReviewableProfiles(limit?: number): Promise<AccountProfile[]>
    getReviewableScoutProfiles(): Promise<ScoutVettingRecord[]>
    createGuardianLink(playerUserId: string): Promise<GuardianPlayerLink>
    updateGuardianLink(linkId: string, status: Extract<GuardianLinkStatus, 'pending' | 'approved' | 'rejected' | 'revoked'>): Promise<GuardianPlayerLink>
    recordConsent(input: {
        subjectUserId: string
        consentType: ConsentType
        decision: ConsentDecision
        consentVersion: string
    }): Promise<ConsentRecord>
    setProfileStatus(userId: string, status: ProfileStatus): Promise<void>
    setScoutVettingStatus(userId: string, status: ProfileStatus): Promise<void>
}
