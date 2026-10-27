import type { ConsentDecision, ConsentRecord, ConsentType } from './supabase/contracts'

/**
 * Pure presentation helpers shared by the server-backed role dashboards.
 * They intentionally have no runtime imports so they can be unit tested and
 * reused on both the server and the client.
 */

export interface ConsentState {
    consentType: ConsentType
    decision: ConsentDecision
    recordedAt: string
}

/** Participation consents an adult athlete records for themselves. */
export const playerSelfConsentTypes: ConsentType[] = ['participation', 'media', 'safeguarding', 'financial']

/** Safeguarding consents a scout must keep current. */
export const scoutConsentTypes: ConsentType[] = ['scout_code', 'background_check', 'no_contact_policy']

/** Delegated consents a guardian records for a linked athlete. */
export const guardianDelegatedConsentTypes: ConsentType[] = ['participation', 'media', 'safeguarding', 'financial']

const statusLabels: Record<string, string> = {
    pending: 'Pending review',
    approved: 'Approved',
    active: 'Active',
    rejected: 'Rejected',
    reviewed: 'Reviewed',
}

const roleLabels: Record<string, string> = {
    player: 'Athlete',
    scout: 'Scout',
    guardian: 'Guardian',
    admin: 'Administrator',
}

/**
 * The append-only consent history is reduced to the current decision per
 * consent type. `consent_revision` is the deterministic tie-breaker the
 * database also uses, so the newest revision always wins.
 */
export function latestConsentStates(records: ConsentRecord[]): ConsentState[] {
    const current = new Map<ConsentType, ConsentState>()
    const ordered = [...records].sort((a, b) => b.consent_revision - a.consent_revision)

    for (const record of ordered) {
        if (current.has(record.consent_type)) continue
        current.set(record.consent_type, {
            consentType: record.consent_type,
            decision: record.decision,
            recordedAt: record.recorded_at,
        })
    }

    return [...current.values()].sort((a, b) => a.consentType.localeCompare(b.consentType))
}

export function consentDecision(states: ConsentState[], consentType: ConsentType): ConsentDecision | null {
    return states.find(state => state.consentType === consentType)?.decision ?? null
}

export function missingConsentTypes(states: ConsentState[], required: ConsentType[]): ConsentType[] {
    return required.filter(type => consentDecision(states, type) !== 'granted')
}

export function hasAllConsents(states: ConsentState[], required: ConsentType[]): boolean {
    return missingConsentTypes(states, required).length === 0
}

export function accountStatusLabel(status: string | null | undefined): string {
    if (!status) return 'Not available'
    return statusLabels[status] ?? status
}

export function profileRoleLabel(role: string | null | undefined): string {
    if (!role) return 'Account'
    return roleLabels[role] ?? role
}

export function accountDisplayName(
    firstName: string | null | undefined,
    lastName: string | null | undefined,
    fallback = 'Account',
): string {
    const name = [firstName, lastName].filter(Boolean).join(' ').trim()
    return name || fallback
}

export function formatShortDate(value: string | null | undefined): string {
    if (!value) return 'Not recorded'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Not recorded'
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Renders enum-ish values such as `american-football` or `age_band` for people. */
export function humanizeToken(value: string | null | undefined): string {
    if (!value) return 'Not recorded'
    return value.replaceAll('-', ' ').replaceAll('_', ' ')
}
