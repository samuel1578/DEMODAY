'use server'

import { createHash, randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ConsentType } from '@/lib/supabase/contracts'
import {
    isUnder18,
    validateOnboardingForm,
    type OnboardingActionState,
} from '@/lib/supabase/onboarding-validation'

const inviteTokenPattern = /^[A-Za-z0-9_-]{43}$/

function hashInviteToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex')
}

async function getAuthenticatedRole() {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) return { supabase, user: null, role: null }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', authData.user.id)
        .maybeSingle()

    if (profileError || !profile) return { supabase, user: authData.user, role: null }
    return { supabase, user: authData.user, role: profile.role as 'player' | 'guardian' | 'scout' | 'admin' }
}

function failed(message: string, fieldErrors?: Record<string, string>): OnboardingActionState {
    return { status: 'error', message, fieldErrors }
}

function logRpcFailure(rpc: string, error: { code?: string; message?: string }): void {
    console.error(`[onboarding] ${rpc} failed`, { code: error.code, message: error.message })
}

export async function submitOnboardingAction(
    _previousState: OnboardingActionState,
    formData: FormData,
): Promise<OnboardingActionState> {
    const { supabase, user, role } = await getAuthenticatedRole()
    if (!user) return failed('Sign in before submitting your profile.')
    if (!role || !['player', 'guardian', 'scout'].includes(role)) {
        return failed('The account role could not be verified. Contact support if this continues.')
    }

    const validation = validateOnboardingForm(role, formData)
    if (!validation.success) {
        return failed('Review the highlighted fields and submit again.', validation.fieldErrors)
    }

    if (validation.data.role === 'player') {
        const player = validation.data.value
        const minor = isUnder18(player.dateOfBirth)
        const rawInviteToken = minor ? randomBytes(32).toString('base64url') : null
        const guardianInviteHash = rawInviteToken ? hashInviteToken(rawInviteToken) : null
        const { error } = await supabase.rpc('submit_player_onboarding', {
            p_date_of_birth: player.dateOfBirth,
            p_sport: player.sport,
            p_gender: player.gender,
            p_region: player.region,
            p_district: player.district,
            p_community: player.community,
            p_school: player.school,
            p_primary_position: player.primaryPosition,
            p_secondary_position: player.secondaryPosition,
            p_dominant_side: player.dominantSide,
            p_jersey_number: player.jerseyNumber,
            p_height_cm: player.heightCm,
            p_weight_kg: player.weightKg,
            p_experience_level: player.experienceLevel,
            p_years_playing: player.yearsPlaying,
            p_previous_club: player.previousClub,
            p_bio: player.bio,
            p_goals: player.goals,
            p_highlight_url: player.highlightUrl,
            p_achievements: player.achievements,
            p_consent_participation: player.consentParticipation,
            p_consent_media: player.consentMedia,
            p_consent_safeguarding: player.consentSafeguarding,
            p_consent_financial: player.consentFinancial,
            p_consent_discovery: player.consentDiscovery,
            p_guardian_invite_hash: guardianInviteHash,
        })

        if (error) {
            logRpcFailure('submit_player_onboarding', error)
            return failed('The player profile could not be saved. Check the fields and try again.')
        }
        revalidatePath('/account/pending')
        revalidatePath('/account/guardian-approval')
        return {
            status: 'success',
            message: minor
                ? 'Your profile was saved. Share this one-time guardian invitation so the guardian can create or sign in to an account and request the link.'
                : 'Your player profile and consent decisions were saved for review.',
            ...(rawInviteToken ? { guardianInviteUrl: `/account/guardian-invite/${rawInviteToken}` } : {}),
        }
    }

    if (validation.data.role === 'scout') {
        const scout = validation.data.value
        const { error } = await supabase.rpc('submit_scout_onboarding', {
            p_date_of_birth: scout.dateOfBirth,
            p_phone: scout.phone,
            p_nationality: scout.nationality,
            p_region: scout.region,
            p_organisation: scout.organisation,
            p_scout_role: scout.scoutRole,
            p_affiliation_type: scout.affiliationType,
            p_years_experience: scout.yearsExperience,
            p_reference_name: scout.referenceName,
            p_reference_contact: scout.referenceContact,
            p_sports: scout.sports,
            p_positions: scout.positions,
            p_age_bands: scout.ageBands,
            p_regions: scout.regions,
            p_consent_scout_code: true,
            p_consent_background_check: true,
            p_consent_no_contact_policy: true,
        })

        if (error) {
            logRpcFailure('submit_scout_onboarding', error)
            return failed('The scout application could not be saved. Check the fields and try again.')
        }
        revalidatePath('/account/pending')
        return { status: 'success', message: 'Your scout application and safeguarding consents were saved for independent review.' }
    }

    const guardian = validation.data.value
    const inviteHash = guardian.inviteToken ? hashInviteToken(guardian.inviteToken) : null
    const { error } = await supabase.rpc('submit_guardian_onboarding', {
        p_relationship: guardian.relationship,
        p_phone: guardian.phone,
        p_secondary_phone: guardian.secondaryPhone,
        p_region: guardian.region,
        p_address: guardian.address,
        p_emergency_contact_name: guardian.emergencyContactName,
        p_emergency_contact_phone: guardian.emergencyContactPhone,
        p_medical_notes: guardian.medicalNotes,
        p_invite_token_hash: inviteHash,
    })

    if (error) {
        logRpcFailure('submit_guardian_onboarding', error)
        const inviteError = guardian.inviteToken
            ? { inviteToken: 'This invitation is invalid, expired, or already used. Ask the player to generate a new link.' }
            : undefined
        return failed('The guardian profile could not be saved. Check the fields and try again.', inviteError)
    }
    revalidatePath('/account/pending')
    revalidatePath('/account/guardian-approval')
    return {
        status: 'success',
        message: guardian.inviteToken
            ? 'Your guardian profile was saved and the player received your link request. The player must approve it, and your account must be independently reviewed before delegated consent is available.'
            : 'Your guardian profile was saved for independent review. You can claim a player invitation later from its original link.',
    }
}

export async function claimGuardianInviteAction(
    _previousState: OnboardingActionState,
    formData: FormData,
): Promise<OnboardingActionState> {
    const tokenValue = formData.get('inviteToken')
    if (typeof tokenValue !== 'string' || !inviteTokenPattern.test(tokenValue)) {
        return failed('This guardian invitation is invalid or expired.')
    }

    const { supabase, user, role } = await getAuthenticatedRole()
    if (!user) return failed('Sign in before claiming a guardian invitation.')
    if (role !== 'guardian') return failed('Only the account role saved as guardian can claim this invitation.')

    const { data: guardianProfile, error: guardianProfileError } = await supabase
        .from('guardian_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()
    if (guardianProfileError || !guardianProfile) {
        return failed('Complete your guardian profile before claiming this invitation.')
    }

    const { error } = await supabase.rpc('claim_guardian_invite', {
        p_invite_token_hash: hashInviteToken(tokenValue),
    })
    if (error) {
        logRpcFailure('claim_guardian_invite', error)
        return failed('This guardian invitation is invalid, expired, or already used.')
    }

    revalidatePath('/account/pending')
    revalidatePath('/account/guardian-approval')
    return {
        status: 'success',
        message: 'The guardian link request was sent. The player must approve it; account review remains a separate step.',
    }
}

export async function updateGuardianLinkAction(formData: FormData): Promise<void> {
    const linkId = formData.get('linkId')
    const nextStatus = formData.get('status')
    if (typeof linkId !== 'string' || !/^[0-9a-f-]{36}$/i.test(linkId)) redirect('/account/guardian-approval')
    if (nextStatus !== 'approved' && nextStatus !== 'rejected') redirect('/account/guardian-approval')

    const { supabase, user, role } = await getAuthenticatedRole()
    if (!user) redirect('/sign-in')
    if (role !== 'player') redirect('/account/pending')

    const { data, error } = await supabase
        .from('guardian_player_links')
        .update({ status: nextStatus })
        .eq('id', linkId)
        .eq('player_user_id', user.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle()

    if (error || !data) redirect('/account/guardian-approval?result=unchanged')
    revalidatePath('/account/pending')
    revalidatePath('/account/guardian-approval')
    redirect('/account/guardian-approval?result=updated')
}

export async function recordGuardianConsentsAction(
    _previousState: OnboardingActionState,
    formData: FormData,
): Promise<OnboardingActionState> {
    const playerUserId = formData.get('playerUserId')
    if (typeof playerUserId !== 'string' || !/^[0-9a-f-]{36}$/i.test(playerUserId)) {
        return failed('Select a valid linked player.')
    }
    for (const field of ['participation', 'media', 'safeguarding', 'financial']) {
        if (formData.get(`consent_${field}`) !== 'yes') {
            return failed('All required guardian consents must be selected.', { [`consent_${field}`]: 'This consent is required.' })
        }
    }
    const discovery = formData.get('consent_discovery') === 'yes'

    const { supabase, user, role } = await getAuthenticatedRole()
    if (!user) return failed('Sign in before recording guardian consent.')
    if (role !== 'guardian') return failed('Only a guardian account can record delegated consent.')

    const { data: account, error: accountError } = await supabase
        .from('profiles')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle()
    if (accountError || !account || !['approved', 'active'].includes(account.status)) {
        return failed('Guardian account review must be approved before delegated consent can be recorded.')
    }

    const { data: link, error: linkError } = await supabase
        .from('guardian_player_links')
        .select('id')
        .eq('guardian_user_id', user.id)
        .eq('player_user_id', playerUserId)
        .eq('status', 'approved')
        .maybeSingle()
    if (linkError || !link) return failed('This player link is not approved or is no longer active.')

    const consentTypes = ['participation', 'media', 'safeguarding', 'financial'] as const
    const rows: { subject_user_id: string; consent_type: ConsentType; decision: 'granted' | 'withdrawn'; consent_version: string }[] = consentTypes.map(consentType => ({
        subject_user_id: playerUserId,
        consent_type: consentType,
        decision: 'granted',
        consent_version: 'v1',
    }))
    rows.push({
        subject_user_id: playerUserId,
        consent_type: 'profile_discovery',
        decision: discovery ? 'granted' : 'withdrawn',
        consent_version: 'v1',
    })

    const { error } = await supabase.from('consent_records').insert(rows)
    if (error) {
        logRpcFailure('consent_records.insert', error)
        return failed('The consent history could not be saved. Confirm the approved link and try again.')
    }

    revalidatePath('/account/pending')
    revalidatePath('/account/guardian-approval')
    return { status: 'success', message: 'Guardian consent was recorded in the append-only consent history.' }
}
