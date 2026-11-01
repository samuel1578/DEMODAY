import type {
    AccountProfile,
    EventRecord,
    GuardianPlayerLink,
    MediaStatus,
    ProfileRole,
    ProfileStatus,
    ScoutVettingRecord,
} from './supabase/contracts'

export const adminProfileWindowLimit = 200

export interface AdminOverviewSummary {
    profiles: {
        loaded: number
        capped: boolean
        byRole: Record<ProfileRole, number>
        byStatus: Record<ProfileStatus, number>
        awaitingReview: number
    }
    scoutVetting: {
        loaded: number
        awaitingReview: number
    }
    events: {
        total: number
        byStatus: Record<EventRecord['status'], number>
        spotlight: number
    }
    guardianLinks: {
        total: number
        byStatus: Record<GuardianPlayerLink['status'], number>
        expiredPending: number
    }
    pendingMediaLoaded: number
}

export function summarizeAdminOverview(input: {
    profiles: AccountProfile[]
    scoutVettings: ScoutVettingRecord[]
    events: EventRecord[]
    guardianLinks: GuardianPlayerLink[]
    pendingMedia: number
    now?: string
}): AdminOverviewSummary {
    const byRole: Record<ProfileRole, number> = { player: 0, scout: 0, guardian: 0, admin: 0 }
    const byStatus: Record<ProfileStatus, number> = {
        pending: 0,
        approved: 0,
        rejected: 0,
        reviewed: 0,
        active: 0,
    }
    const eventStatus = { draft: 0, published: 0, cancelled: 0, completed: 0 }
    const guardianStatus = { pending: 0, approved: 0, rejected: 0, revoked: 0, expired: 0 }
    const now = input.now ? Date.parse(input.now) : Date.now()

    for (const profile of input.profiles) {
        byRole[profile.role] += 1
        byStatus[profile.status] += 1
    }
    for (const event of input.events) eventStatus[event.status] += 1
    for (const link of input.guardianLinks) guardianStatus[link.status] += 1

    const expiredPending = input.guardianLinks.filter(link => {
        if (link.status !== 'pending' || !link.expires_at) return false
        const expiresAt = Date.parse(link.expires_at)
        return Number.isFinite(expiresAt) && expiresAt <= now
    }).length

    return {
        profiles: {
            loaded: input.profiles.length,
            capped: input.profiles.length >= adminProfileWindowLimit,
            byRole,
            byStatus,
            awaitingReview: byStatus.pending + byStatus.reviewed,
        },
        scoutVetting: {
            loaded: input.scoutVettings.length,
            awaitingReview: input.scoutVettings.filter(item => item.vetting_status === 'pending' || item.vetting_status === 'reviewed').length,
        },
        events: {
            total: input.events.length,
            byStatus: eventStatus,
            spotlight: input.events.filter(event => event.is_spotlight).length,
        },
        guardianLinks: {
            total: input.guardianLinks.length,
            byStatus: guardianStatus,
            expiredPending,
        },
        pendingMediaLoaded: input.pendingMedia,
    }
}
