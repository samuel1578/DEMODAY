import 'server-only'

import type { User } from '@supabase/supabase-js'
import {
    accountDisplayName,
    latestConsentStates,
    missingConsentTypes,
    playerSelfConsentTypes,
    scoutConsentTypes,
    type ConsentState,
} from '@/lib/dashboard'
import { requireAuthenticatedUser } from './auth'
import type {
    AccountProfile,
    AuditLogEntry,
    ConsentRecord,
    ConsentType,
    GuardianPlayerLink,
    GuardianProfileRecord,
    PlayerPrivateDetails,
    PlayerProfileRecord,
    ScoutDiscoverablePlayer,
    ScoutInterestRecord,
    ScoutProfileRecord,
    ScoutVettingRecord,
} from './contracts'
import { createDemoDayDataContract } from './data-contract'
import { getAccountOnboardingProgress } from './onboarding-state'
import { isUnder18 } from './onboarding-validation'

/**
 * Server-only composition layer for the role dashboards. It reads through the
 * request-scoped data contract, so every query is still authorized by RLS and
 * the admin RPCs. No role decision is taken from client-supplied state.
 */

export interface PlayerDashboardData {
    email: string | null
    accountStatus: string
    displayName: string
    profile: PlayerProfileRecord | null
    privateDetails: PlayerPrivateDetails | null
    isMinor: boolean
    guardianApprovalComplete: boolean | null
    consentStates: ConsentState[]
    missingConsents: ConsentType[]
    missing: string[]
}

export interface ScoutDashboardData {
    email: string | null
    accountStatus: string
    displayName: string
    profile: ScoutProfileRecord | null
    interests: ScoutInterestRecord[]
    consentStates: ConsentState[]
    missingConsents: ConsentType[]
    discoverablePlayers: ScoutDiscoverablePlayer[]
    missing: string[]
}

export interface GuardianLinkedAthlete {
    link: GuardianPlayerLink
    athleteName: string
    athleteStatus: string | null
    profile: PlayerProfileRecord | null
    privateDetails: PlayerPrivateDetails | null
    consentStates: ConsentState[]
}

export interface GuardianDashboardData {
    email: string | null
    accountStatus: string
    displayName: string
    profile: GuardianProfileRecord | null
    reviewApproved: boolean
    approvedLinks: GuardianLinkedAthlete[]
    otherLinks: GuardianLinkedAthlete[]
    missing: string[]
}

export interface AdminReviewData {
    profiles: AccountProfile[]
    scoutVettings: ScoutVettingRecord[]
    audit: AuditLogEntry[]
}

function selfConsentRecords(records: ConsentRecord[], userId: string): ConsentRecord[] {
    return records.filter(record => record.subject_user_id === userId && record.actor_user_id === userId)
}

export async function loadPlayerDashboard(user?: User): Promise<PlayerDashboardData> {
    const authUser = user ?? await requireAuthenticatedUser()
    const contract = await createDemoDayDataContract()
    const [account, player, consentHistory, progress] = await Promise.all([
        contract.getAccountProfile(),
        contract.getPlayerProfile(),
        contract.getMyConsentHistory(),
        getAccountOnboardingProgress(authUser),
    ])

    const profile = player?.profile ?? null
    const privateDetails = player?.privateDetails ?? null
    const isMinor = privateDetails ? isUnder18(privateDetails.date_of_birth) : false
    const consentStates = latestConsentStates(selfConsentRecords(consentHistory, authUser.id))

    return {
        email: authUser.email ?? null,
        accountStatus: account?.status ?? progress.accountStatus ?? 'pending',
        displayName: accountDisplayName(account?.first_name, account?.last_name, 'Athlete'),
        profile,
        privateDetails,
        isMinor,
        guardianApprovalComplete: progress.under18GuardianApprovalComplete,
        consentStates,
        missingConsents: !isMinor && profile ? missingConsentTypes(consentStates, playerSelfConsentTypes) : [],
        missing: progress.missing,
    }
}

export async function loadScoutDashboard(user?: User): Promise<ScoutDashboardData> {
    const authUser = user ?? await requireAuthenticatedUser()
    const contract = await createDemoDayDataContract()
    const [account, profile, interests, consentHistory, discoverablePlayers, progress] = await Promise.all([
        contract.getAccountProfile(),
        contract.getScoutProfile(),
        contract.getScoutInterests(),
        contract.getMyConsentHistory(),
        contract.getScoutDiscoverablePlayers(),
        getAccountOnboardingProgress(authUser),
    ])

    const consentStates = latestConsentStates(selfConsentRecords(consentHistory, authUser.id))

    return {
        email: authUser.email ?? null,
        accountStatus: account?.status ?? progress.accountStatus ?? 'pending',
        displayName: accountDisplayName(account?.first_name, account?.last_name, 'Scout'),
        profile,
        interests,
        consentStates,
        missingConsents: missingConsentTypes(consentStates, scoutConsentTypes),
        discoverablePlayers,
        missing: progress.missing,
    }
}

export async function loadGuardianDashboard(user?: User): Promise<GuardianDashboardData> {
    const authUser = user ?? await requireAuthenticatedUser()
    const contract = await createDemoDayDataContract()
    const [account, profile, links, progress] = await Promise.all([
        contract.getAccountProfile(),
        contract.getGuardianProfile(),
        contract.getGuardianPlayerLinks(),
        getAccountOnboardingProgress(authUser),
    ])

    const reviewApproved = !!account && ['approved', 'active'].includes(account.status)

    const linked: GuardianLinkedAthlete[] = await Promise.all(links.map(async link => {
        // Linked athlete details and delegated consent require an approved link
        // and an approved guardian account; RLS enforces the same rule.
        if (link.status !== 'approved' || !reviewApproved) {
            return {
                link,
                athleteName: 'Linked athlete',
                athleteStatus: null,
                profile: null,
                privateDetails: null,
                consentStates: [],
            }
        }

        const [athlete, athleteProfile, consentHistory] = await Promise.all([
            contract.getLinkedPlayerAccount(link.player_user_id),
            contract.getLinkedPlayerProfile(link.player_user_id),
            contract.getLinkedAthleteConsentHistory(link.player_user_id),
        ])

        return {
            link,
            athleteName: accountDisplayName(athlete?.first_name, athlete?.last_name, 'Linked athlete'),
            athleteStatus: athlete?.status ?? null,
            profile: athleteProfile?.profile ?? null,
            privateDetails: athleteProfile?.privateDetails ?? null,
            consentStates: latestConsentStates(consentHistory),
        }
    }))

    return {
        email: authUser.email ?? null,
        accountStatus: account?.status ?? progress.accountStatus ?? 'pending',
        displayName: accountDisplayName(account?.first_name, account?.last_name, 'Guardian'),
        profile,
        reviewApproved,
        approvedLinks: linked.filter(item => item.link.status === 'approved'),
        otherLinks: linked.filter(item => item.link.status !== 'approved'),
        missing: progress.missing,
    }
}

export async function loadAdminReview(): Promise<AdminReviewData> {
    const contract = await createDemoDayDataContract()
    const [profiles, scoutVettings, audit] = await Promise.all([
        contract.getReviewableProfiles(),
        contract.getReviewableScoutProfiles(),
        contract.getAdminAuditLog(25),
    ])
    return { profiles, scoutVettings, audit }
}
