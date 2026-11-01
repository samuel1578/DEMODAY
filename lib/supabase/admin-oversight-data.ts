import 'server-only'

import { accountDisplayName, latestConsentStates, type ConsentState } from '@/lib/dashboard'
import { eligibleProfileReviewMedia, buildAdminProfileSubmissionReview, type AdminProfileReviewMedia, type AdminProfileSubmissionReview } from '@/lib/admin-profile-review'
import { resolveDeliveryUrl } from '@/lib/cloudflare/images'
import { mediaTypeLabels } from '@/lib/media'
import { isUnder18 } from './onboarding-validation'
import type {
    AccountProfile,
    AuditLogEntry,
    EventRecord,
    GuardianPlayerLink,
    MediaStatus,
    ProfileMediaRecord,
    ScoutVettingRecord,
} from './contracts'
import { createDemoDayDataContract } from './data-contract'

export interface AdminOverviewData {
    profiles: AccountProfile[]
    scoutVettings: ScoutVettingRecord[]
    events: EventRecord[]
    guardianLinks: GuardianPlayerLink[]
    pendingMediaLoaded: number
    audit: AuditLogEntry[]
}

export interface AdminMediaItem {
    id: string
    ownerName: string
    ownerRole: string
    ownerStatus: string
    mediaType: ProfileMediaRecord['media_type']
    mediaLabel: string
    status: MediaStatus
    visibility: ProfileMediaRecord['visibility']
    requiresSignedUrls: boolean
    contentType: string
    byteSize: number
    isCurrent: boolean
    createdAt: string
    deliveryUrl: string | null
}

export interface AdminGuardianItem {
    link: Pick<GuardianPlayerLink, 'id' | 'status' | 'requested_at' | 'expires_at' | 'decided_at' | 'updated_at'>
    guardianName: string
    guardianStatus: string
    playerName: string
    playerStatus: string
    consentStates: ConsentState[]
}

export async function loadAdminOverview(): Promise<AdminOverviewData> {
    const contract = await createDemoDayDataContract()
    const [profiles, scoutVettings, events, guardianLinks, pendingMedia, audit] = await Promise.all([
        contract.getReviewableProfiles(200),
        contract.getReviewableScoutProfiles(),
        contract.getAdminEvents(),
        contract.getGuardianPlayerLinks(),
        contract.getAdminMedia('pending', 200),
        contract.getAdminAuditLog(8),
    ])

    return {
        profiles,
        scoutVettings,
        events,
        guardianLinks,
        pendingMediaLoaded: pendingMedia.length,
        audit,
    }
}

export async function loadAdminMedia(status?: MediaStatus): Promise<AdminMediaItem[]> {
    const contract = await createDemoDayDataContract()
    const records = await contract.getAdminMedia(status, 200)
    const owners = await contract.getProfilesByUserIds([...new Set(records.map(record => record.owner_user_id))])
    const ownersById = new Map(owners.map(owner => [owner.user_id, owner]))

    return Promise.all(records.map(async record => {
        const owner = ownersById.get(record.owner_user_id)
        const ownerName = accountDisplayName(owner?.first_name, owner?.last_name, 'Account')
        const shouldResolveImage = record.is_current
            && record.deleted_at === null
            && record.status !== 'rejected'
        const deliveryUrl = shouldResolveImage
            ? await resolveDeliveryUrl(record.cloudflare_image_id, record.visibility)
            : null

        return {
            id: record.id,
            ownerName,
            ownerRole: owner?.role ?? 'account',
            ownerStatus: owner?.status ?? 'not available',
            mediaType: record.media_type,
            mediaLabel: mediaTypeLabels[record.media_type],
            status: record.status,
            visibility: record.visibility,
            requiresSignedUrls: record.requires_signed_urls,
            contentType: record.content_type,
            byteSize: record.byte_size,
            isCurrent: record.is_current && record.deleted_at === null,
            createdAt: record.created_at,
            deliveryUrl,
        }
    }))
}

export async function loadAdminGuardianOversight(): Promise<AdminGuardianItem[]> {
    const contract = await createDemoDayDataContract()
    const links = await contract.getGuardianPlayerLinks()
    const userIds = [...new Set(links.flatMap(link => [link.guardian_user_id, link.player_user_id]))]
    const playerIds = [...new Set(links.map(link => link.player_user_id))]
    const [accounts, consentHistory] = await Promise.all([
        contract.getProfilesByUserIds(userIds),
        contract.getAdminConsentHistory(playerIds),
    ])
    const accountsById = new Map(accounts.map(account => [account.user_id, account]))
    const consentByPlayer = new Map<string, ConsentState[]>()

    for (const playerId of playerIds) {
        consentByPlayer.set(playerId, latestConsentStates(
            consentHistory.filter(record => record.subject_user_id === playerId),
        ))
    }

    return links.map(link => {
        const guardian = accountsById.get(link.guardian_user_id)
        const player = accountsById.get(link.player_user_id)
        return {
            link: {
                id: link.id,
                status: link.status,
                requested_at: link.requested_at,
                expires_at: link.expires_at,
                decided_at: link.decided_at,
                updated_at: link.updated_at,
            },
            guardianName: accountDisplayName(guardian?.first_name, guardian?.last_name, 'Guardian account'),
            guardianStatus: guardian?.status ?? 'not available',
            playerName: accountDisplayName(player?.first_name, player?.last_name, 'Athlete account'),
            playerStatus: player?.status ?? 'not available',
            consentStates: consentByPlayer.get(link.player_user_id) ?? [],
        }
    })
}

type SafeRead<T> = { value: T; failed: false } | { value: null; failed: true }

async function safeAdminRead<T>(read: () => Promise<T>): Promise<SafeRead<T>> {
    try {
        return { value: await read(), failed: false }
    } catch {
        return { value: null, failed: true }
    }
}

async function resolveReviewMedia(records: ProfileMediaRecord[]): Promise<AdminProfileReviewMedia[]> {
    const candidates = records.map(record => ({
        record,
        mediaType: record.media_type,
        status: record.status,
        contentType: record.content_type,
        isCurrent: record.is_current,
        deletedAt: record.deleted_at,
    }))
    const eligible = eligibleProfileReviewMedia(candidates)

    return Promise.all(eligible.map(async ({ record }) => {
        let deliveryUrl: string | null = null
        try {
            if (record.cloudflare_image_id) {
                deliveryUrl = await resolveDeliveryUrl(record.cloudflare_image_id, record.visibility)
            }
        } catch {
            // Keep the metadata visible, but do not fail the whole review if R2 delivery is unavailable.
        }
        return {
            id: record.id,
            label: mediaTypeLabels[record.media_type],
            mediaType: record.media_type as Exclude<ProfileMediaRecord['media_type'], 'identity_document'>,
            status: record.status,
            visibility: record.visibility,
            contentType: record.content_type,
            createdAt: record.created_at,
            deliveryUrl,
        }
    }))
}

export async function loadAdminProfileSubmission(userId: string): Promise<AdminProfileSubmissionReview | null> {
    const contract = await createDemoDayDataContract()
    const accounts = await contract.getProfilesByUserIds([userId])
    const account = accounts.find(profile => profile.user_id === userId)
    if (!account) return null

    const warnings: string[] = []
    if (account.role === 'player') {
        const [profile, consents, media] = await Promise.all([
            safeAdminRead(() => contract.getAdminPlayerReview(userId)),
            safeAdminRead(() => contract.getAdminConsentHistory([userId])),
            safeAdminRead(() => contract.getAdminProfileMedia(userId)),
        ])
        if (profile.failed) warnings.push('athlete profile')
        if (consents.failed) warnings.push('consent history')
        if (media.failed) warnings.push('submitted images')

        const player = profile.value ? {
            sport: profile.value.profile.sport,
            region: profile.value.profile.region,
            primary_position: profile.value.profile.primary_position,
            secondary_position: profile.value.profile.secondary_position,
            dominant_side: profile.value.profile.dominant_side,
            experience_level: profile.value.profile.experience_level,
            years_playing: profile.value.profile.years_playing,
            previous_club: profile.value.profile.previous_club,
            bio: profile.value.profile.bio,
            goals: profile.value.profile.goals,
            highlight_url: profile.value.profile.highlight_url,
            achievements: profile.value.profile.achievements,
            isMinor: profile.value.dateOfBirth ? isUnder18(profile.value.dateOfBirth) : null,
        } : null

        return buildAdminProfileSubmissionReview({
            account,
            player,
            consentStates: consents.value
                ? latestConsentStates(consents.value.filter(record => record.subject_user_id === userId))
                : [],
            media: media.value ? await resolveReviewMedia(media.value) : [],
            dataWarnings: warnings,
        })
    }

    if (account.role === 'scout') {
        const [scout, interests, consents, media] = await Promise.all([
            safeAdminRead(() => contract.getAdminScoutReview(userId)),
            safeAdminRead(() => contract.getAdminScoutInterests(userId)),
            safeAdminRead(() => contract.getAdminConsentHistory([userId])),
            safeAdminRead(() => contract.getAdminProfileMedia(userId)),
        ])
        if (scout.failed) warnings.push('scout profile')
        if (interests.failed) warnings.push('scouting interests')
        if (consents.failed) warnings.push('consent history')
        if (media.failed) warnings.push('submitted images')

        return buildAdminProfileSubmissionReview({
            account,
            scout: scout.value,
            scoutInterests: interests.value ?? [],
            consentStates: consents.value
                ? latestConsentStates(consents.value.filter(record => record.subject_user_id === userId))
                : [],
            media: media.value ? await resolveReviewMedia(media.value) : [],
            dataWarnings: warnings,
        })
    }

    if (account.role === 'guardian') {
        const [guardian, media] = await Promise.all([
            safeAdminRead(() => contract.getAdminGuardianReview(userId)),
            safeAdminRead(() => contract.getAdminProfileMedia(userId)),
        ])
        if (guardian.failed) warnings.push('guardian profile')
        if (media.failed) warnings.push('submitted images')
        return buildAdminProfileSubmissionReview({
            account,
            guardian: guardian.value,
            media: media.value ? await resolveReviewMedia(media.value) : [],
            dataWarnings: warnings,
        })
    }

    return buildAdminProfileSubmissionReview({ account })
}
