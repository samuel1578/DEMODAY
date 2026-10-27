import 'server-only'

import { requireAuthenticatedUser } from './auth'
import { createClient } from './server'
import type {
    AccountProfile,
    AuditLogEntry,
    ConsentDecision,
    ConsentRecord,
    ConsentType,
    DemoDayServerDataContract,
    EventMutationInput,
    EventRecord,
    GuardianPlayerLink,
    GuardianProfileRecord,
    GuardianLinkStatus,
    PlayerPrivateDetails,
    PlayerProfileRecord,
    ProfileMediaRecord,
    PublishedEvent,
    ProfileStatus,
    ScoutDiscoverablePlayer,
    ScoutInterestRecord,
    ScoutProfileRecord,
    ScoutVettingRecord,
} from './contracts'

function failOnError(error: { message: string } | null, operation: string): void {
    if (error) throw new Error(`${operation} failed: ${error.message}`)
}

function requireRow<T>(data: T | null, operation: string): T {
    if (data === null) throw new Error(`${operation} returned no row`)
    return data
}

/**
 * Creates the authenticated server-side data contract. Reads and mutations use
 * the request's cookie-backed Supabase client; RLS remains the authorization
 * boundary, including for admin RPCs and guardian/scout operations.
 */
export async function createDemoDayDataContract(): Promise<DemoDayServerDataContract> {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    return {
        async getAccountProfile() {
            const { data, error } = await supabase
                .from('profiles')
                .select('user_id,role,status,first_name,last_name,created_at,updated_at')
                .eq('user_id', user.id)
                .maybeSingle()
            failOnError(error, 'Load account profile')
            return data as AccountProfile | null
        },

        async getPlayerProfile() {
            const [profileResult, privateResult] = await Promise.all([
                supabase
                    .from('player_profiles')
                    .select('user_id,sport,region,primary_position,secondary_position,dominant_side,experience_level,years_playing,previous_club,bio,goals,highlight_url,achievements,created_at,updated_at')
                    .eq('user_id', user.id)
                    .maybeSingle(),
                supabase
                    .from('player_private_details')
                    .select('user_id,date_of_birth,gender,district,community,school,jersey_number,height_cm,weight_kg,created_at,updated_at')
                    .eq('user_id', user.id)
                    .maybeSingle(),
            ])
            failOnError(profileResult.error, 'Load player profile')
            failOnError(privateResult.error, 'Load private athlete details')

            if (!profileResult.data) return null
            return {
                profile: profileResult.data as PlayerProfileRecord,
                privateDetails: privateResult.data as PlayerPrivateDetails | null,
            }
        },

        async getLinkedPlayerAccount(playerUserId) {
            const { data, error } = await supabase
                .from('profiles')
                .select('user_id,role,status,first_name,last_name,created_at,updated_at')
                .eq('user_id', playerUserId)
                .maybeSingle()
            failOnError(error, 'Load linked athlete account')
            return data as AccountProfile | null
        },

        async getLinkedPlayerProfile(playerUserId) {
            const [profileResult, privateResult] = await Promise.all([
                supabase
                    .from('player_profiles')
                    .select('user_id,sport,region,primary_position,secondary_position,dominant_side,experience_level,years_playing,previous_club,bio,goals,highlight_url,achievements,created_at,updated_at')
                    .eq('user_id', playerUserId)
                    .maybeSingle(),
                supabase
                    .from('player_private_details')
                    .select('user_id,date_of_birth,gender,district,community,school,jersey_number,height_cm,weight_kg,created_at,updated_at')
                    .eq('user_id', playerUserId)
                    .maybeSingle(),
            ])
            failOnError(profileResult.error, 'Load linked athlete profile')
            failOnError(privateResult.error, 'Load linked athlete private details')

            if (!profileResult.data) return null
            return {
                profile: profileResult.data as PlayerProfileRecord,
                privateDetails: privateResult.data as PlayerPrivateDetails | null,
            }
        },

        async getLinkedAthleteConsentHistory(playerUserId) {
            const { data, error } = await supabase
                .from('consent_records')
                .select('id,actor_user_id,subject_user_id,consent_type,decision,consent_version,recorded_at,consent_revision')
                .eq('subject_user_id', playerUserId)
                .order('consent_revision', { ascending: false })
            failOnError(error, 'Load linked athlete consent history')
            return (data ?? []) as ConsentRecord[]
        },

        async getScoutProfile() {
            const { data, error } = await supabase
                .from('scout_profiles')
                .select('user_id,date_of_birth,phone,nationality,region,organisation,scout_role,affiliation_type,years_experience,reference_name,reference_contact,vetting_status,created_at,updated_at')
                .eq('user_id', user.id)
                .maybeSingle()
            failOnError(error, 'Load scout profile')
            return data as ScoutProfileRecord | null
        },

        async getScoutInterests() {
            const { data, error } = await supabase
                .from('scout_interests')
                .select('user_id,interest_type,interest_value')
                .eq('user_id', user.id)
                .order('interest_type', { ascending: true })
                .order('interest_value', { ascending: true })
            failOnError(error, 'Load scout interests')
            return (data ?? []) as ScoutInterestRecord[]
        },

        async getGuardianProfile() {
            const { data, error } = await supabase
                .from('guardian_profiles')
                .select('user_id,relationship,phone,secondary_phone,region,address,emergency_contact_name,emergency_contact_phone,medical_notes,created_at,updated_at')
                .eq('user_id', user.id)
                .maybeSingle()
            failOnError(error, 'Load guardian profile')
            return data as GuardianProfileRecord | null
        },

        async getGuardianPlayerLinks() {
            const { data, error } = await supabase
                .from('guardian_player_links')
                .select('id,guardian_user_id,player_user_id,status,requested_at,expires_at,decided_at,decided_by,updated_at')
                .order('requested_at', { ascending: false })
            failOnError(error, 'Load guardian-athlete links')
            return (data ?? []) as GuardianPlayerLink[]
        },

        async getMyConsentHistory() {
            const { data, error } = await supabase
                .from('consent_records')
                .select('id,actor_user_id,subject_user_id,consent_type,decision,consent_version,recorded_at,consent_revision')
                .or(`actor_user_id.eq.${user.id},subject_user_id.eq.${user.id}`)
                .order('consent_revision', { ascending: false })
            failOnError(error, 'Load consent history')
            return (data ?? []) as ConsentRecord[]
        },

        async getMyMedia() {
            const { data, error } = await supabase
                .from('profile_media')
                .select('id,owner_user_id,media_type,cloudflare_image_id,visibility,requires_signed_urls,status,content_type,byte_size,is_current,approved_by,approved_at,deleted_at,created_at,updated_at')
                .eq('owner_user_id', user.id)
                .order('created_at', { ascending: false })
            failOnError(error, 'Load media records')
            return (data ?? []) as ProfileMediaRecord[]
        },

        async getScoutDiscoverablePlayers() {
            const { data, error } = await supabase
                .from('scout_discoverable_players')
                .select('user_id,first_name,last_initial,sport,region,primary_position,secondary_position,dominant_side,experience_level,years_playing,previous_club,bio,goals,highlight_url,achievements')
                .order('region', { ascending: true })
                .order('sport', { ascending: true })
            failOnError(error, 'Load discoverable athlete profiles')
            return (data ?? []) as ScoutDiscoverablePlayer[]
        },

        async getAdminEvents() {
            const { data, error } = await supabase
                .from('events')
                .select('id,title,description,category,location,starts_at,ends_at,status,is_spotlight,created_by,created_at,updated_at')
                .order('starts_at', { ascending: true })
            failOnError(error, 'Load admin events')
            return (data ?? []) as EventRecord[]
        },

        async createEvent(input: EventMutationInput) {
            const { data, error } = await supabase
                .from('events')
                .insert(input)
                .select('id,title,description,category,location,starts_at,ends_at,status,is_spotlight,created_by,created_at,updated_at')
                .single()
            failOnError(error, 'Create event')
            return requireRow(data as EventRecord | null, 'Create event')
        },

        async updateEvent(eventId: string, input: Partial<EventMutationInput>) {
            const { data, error } = await supabase
                .from('events')
                .update(input)
                .eq('id', eventId)
                .select('id,title,description,category,location,starts_at,ends_at,status,is_spotlight,created_by,created_at,updated_at')
                .maybeSingle()
            failOnError(error, 'Update event')
            return requireRow(data as EventRecord | null, 'Update event')
        },

        async deleteEvent(eventId: string) {
            const { data, error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId)
                .select('id')
                .maybeSingle()
            failOnError(error, 'Delete event')
            requireRow(data as { id: string } | null, 'Delete event')
        },

        async getAdminAuditLog(limit = 100) {
            const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 200) : 100
            const { data, error } = await supabase
                .from('audit_logs')
                .select('id,entity_type,entity_id,action,actor_user_id,old_status,new_status,metadata,created_at')
                .order('created_at', { ascending: false })
                .limit(safeLimit)
            failOnError(error, 'Load audit history')
            return (data ?? []) as AuditLogEntry[]
        },

        async getReviewableProfiles(limit = 200) {
            const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 500) : 200
            const { data, error } = await supabase
                .from('profiles')
                .select('user_id,role,status,first_name,last_name,created_at,updated_at')
                .order('created_at', { ascending: false })
                .limit(safeLimit)
            failOnError(error, 'Load reviewable profiles')
            return (data ?? []) as AccountProfile[]
        },

        async getReviewableScoutProfiles() {
            const { data, error } = await supabase
                .from('scout_profiles')
                .select('user_id,vetting_status')
                .order('created_at', { ascending: false })
            failOnError(error, 'Load reviewable scout profiles')
            return (data ?? []) as ScoutVettingRecord[]
        },

        async createGuardianLink(playerUserId) {
            const { data, error } = await supabase
                .from('guardian_player_links')
                .insert({ player_user_id: playerUserId })
                .select('id,guardian_user_id,player_user_id,status,requested_at,expires_at,decided_at,decided_by,updated_at')
                .single()
            failOnError(error, 'Create guardian-athlete link request')
            return requireRow(data as GuardianPlayerLink | null, 'Create guardian-athlete link request')
        },

        async updateGuardianLink(linkId, status: Extract<GuardianLinkStatus, 'pending' | 'approved' | 'rejected' | 'revoked'>) {
            const { data, error } = await supabase
                .from('guardian_player_links')
                .update({ status })
                .eq('id', linkId)
                .select('id,guardian_user_id,player_user_id,status,requested_at,expires_at,decided_at,decided_by,updated_at')
                .maybeSingle()
            failOnError(error, 'Update guardian-athlete link request')
            return requireRow(data as GuardianPlayerLink | null, 'Update guardian-athlete link request')
        },

        async recordConsent(input: {
            subjectUserId: string
            consentType: ConsentType
            decision: ConsentDecision
            consentVersion: string
        }) {
            const { data, error } = await supabase
                .from('consent_records')
                .insert({
                    actor_user_id: user.id,
                    subject_user_id: input.subjectUserId,
                    consent_type: input.consentType,
                    decision: input.decision,
                    consent_version: input.consentVersion,
                })
                .select('id,actor_user_id,subject_user_id,consent_type,decision,consent_version,recorded_at,consent_revision')
                .single()
            failOnError(error, 'Record consent')
            return requireRow(data as ConsentRecord | null, 'Record consent')
        },

        async setProfileStatus(userId: string, status: ProfileStatus) {
            const { error } = await supabase.rpc('admin_set_profile_status', {
                p_user_id: userId,
                p_status: status,
            })
            failOnError(error, 'Update profile lifecycle status')
        },

        async setScoutVettingStatus(userId: string, status: ProfileStatus) {
            const { error } = await supabase.rpc('admin_set_scout_vetting_status', {
                p_scout_user_id: userId,
                p_status: status,
            })
            failOnError(error, 'Update scout vetting status')
        },
    }
}

/** Published event reads can also be used by unauthenticated server-rendered pages. */
export async function getPublishedEvents(): Promise<PublishedEvent[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('events')
        .select('id,title,description,category,location,starts_at,ends_at,status,is_spotlight,created_by,created_at,updated_at')
        .eq('status', 'published')
        .order('starts_at', { ascending: true })
    failOnError(error, 'Load published events')
    return (data ?? []) as PublishedEvent[]
}
