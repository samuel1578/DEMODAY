import type { AccountRole } from './auth'

export type OnboardingActionState = {
    status: 'idle' | 'error' | 'success'
    message?: string
    fieldErrors?: Record<string, string>
    guardianInviteUrl?: string
}

export type PlayerOnboardingInput = {
    dateOfBirth: string
    sport: string
    gender: 'female' | 'male'
    region: string
    district: string
    community: string | null
    school: string | null
    primaryPosition: string
    secondaryPosition: string | null
    dominantSide: 'right' | 'left' | 'both'
    jerseyNumber: number | null
    heightCm: number | null
    weightKg: number | null
    experienceLevel: 'park' | 'school' | 'district' | 'academy' | 'none'
    yearsPlaying: number | null
    previousClub: string | null
    bio: string | null
    goals: string | null
    highlightUrl: string | null
    achievements: string | null
    consentParticipation: boolean
    consentMedia: boolean
    consentSafeguarding: boolean
    consentFinancial: boolean
    consentDiscovery: boolean
    guardianInviteToken: string | null
}

export type ScoutOnboardingInput = {
    dateOfBirth: string
    phone: string
    nationality: string | null
    region: string | null
    organisation: string
    scoutRole: 'scout' | 'coach' | 'recruiter' | 'analyst' | 'club-official'
    affiliationType: 'club-academy' | 'national-federation' | 'college' | 'independent' | 'media'
    yearsExperience: number | null
    referenceName: string
    referenceContact: string
    sports: string[]
    positions: string[]
    ageBands: string[]
    regions: string[]
}

export type GuardianOnboardingInput = {
    relationship: 'parent' | 'guardian' | 'grandparent' | 'sibling' | 'other'
    phone: string
    secondaryPhone: string | null
    region: string
    address: string
    emergencyContactName: string
    emergencyContactPhone: string
    medicalNotes: string | null
    inviteToken: string | null
}

export type ValidatedOnboarding =
    | { role: 'player'; value: PlayerOnboardingInput }
    | { role: 'scout'; value: ScoutOnboardingInput }
    | { role: 'guardian'; value: GuardianOnboardingInput }

export type ValidationResult =
    | { success: true; data: ValidatedOnboarding }
    | { success: false; fieldErrors: Record<string, string> }

const regions = new Set([
    'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern',
    'Greater Accra', 'North East', 'Northern', 'Savannah', 'Upper East',
    'Upper West', 'Volta', 'Western', 'Western North',
])

const positionsBySport: Record<string, Set<string>> = {
    football: new Set([
        'goalkeeper', 'right-back', 'centre-back', 'left-back', 'defensive-midfield',
        'central-midfield', 'attacking-midfield', 'right-wing', 'left-wing', 'forward', 'striker',
    ]),
    basketball: new Set(['point-guard', 'shooting-guard', 'small-forward', 'power-forward', 'center']),
    'american-football': new Set([
        'quarterback', 'running-back', 'wide-receiver', 'tight-end', 'offensive-line',
        'defensive-line', 'linebacker', 'cornerback', 'safety', 'kicker', 'return-specialist',
    ]),
}

const sports = new Set(Object.keys(positionsBySport))
const ageBands = new Set(['u14', 'u16', 'u18', 'u21', 'senior'])
const scoutRoles = new Set(['scout', 'coach', 'recruiter', 'analyst', 'club-official'])
const affiliations = new Set(['club-academy', 'national-federation', 'college', 'independent', 'media'])
const relationships = new Set(['parent', 'guardian', 'grandparent', 'sibling', 'other'])
const experienceLevels = new Set(['park', 'school', 'district', 'academy', 'none'])
const inviteTokenPattern = /^[A-Za-z0-9_-]{43}$/

function getText(formData: FormData, key: string, errors: Record<string, string>, maxLength = 500): string {
    const value = formData.get(key)
    if (value === null) return ''
    if (typeof value !== 'string') {
        errors[key] = 'Enter text for this field.'
        return ''
    }
    const trimmed = value.trim()
    if (trimmed.length > maxLength) errors[key] = `Use no more than ${maxLength} characters.`
    return trimmed
}

function getChoice<T extends string>(
    formData: FormData,
    key: string,
    allowed: Set<string>,
    errors: Record<string, string>,
    required = true,
): T | '' {
    const value = getText(formData, key, errors, 100)
    if (!value && !required) return ''
    if (!allowed.has(value)) errors[key] = 'Choose one of the listed options.'
    return value as T | ''
}

function getOptionalText(formData: FormData, key: string, errors: Record<string, string>, maxLength = 500): string | null {
    return getText(formData, key, errors, maxLength) || null
}

function getBoolean(formData: FormData, key: string, errors: Record<string, string>, required: boolean): boolean {
    const value = getText(formData, key, errors, 10)
    if (value && value !== 'yes' && value !== 'no') errors[key] = 'Invalid consent value.'
    if (required && value !== 'yes') errors[key] = 'This consent is required to submit your profile.'
    return value === 'yes'
}

function getInteger(
    formData: FormData,
    key: string,
    errors: Record<string, string>,
    minimum: number,
    maximum: number,
): number | null {
    const value = getText(formData, key, errors, 20)
    if (!value) return null
    if (!/^\d+$/.test(value)) {
        errors[key] = 'Enter a whole number.'
        return null
    }
    const parsed = Number(value)
    if (parsed < minimum || parsed > maximum) errors[key] = `Enter a value from ${minimum} to ${maximum}.`
    return parsed
}

function getDecimal(
    formData: FormData,
    key: string,
    errors: Record<string, string>,
    minimum: number,
    maximum: number,
): number | null {
    const value = getText(formData, key, errors, 20)
    if (!value) return null
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
        errors[key] = 'Enter a number with no more than two decimal places.'
        return null
    }
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
        errors[key] = `Enter a value from ${minimum} to ${maximum}.`
    }
    return parsed
}

function getMultiChoice(
    formData: FormData,
    key: string,
    allowed: Set<string>,
    errors: Record<string, string>,
    required: boolean,
): string[] {
    const values = formData.getAll(key)
    if (values.some(value => typeof value !== 'string')) {
        errors[key] = 'Invalid selection.'
        return []
    }
    const selected = [...new Set((values as string[]).map(value => value.trim()).filter(Boolean))]
    if (required && selected.length === 0) errors[key] = 'Select at least one option.'
    if (selected.some(value => !allowed.has(value))) errors[key] = 'One or more selections are invalid.'
    if (selected.length > allowed.size) errors[key] = 'Too many selections.'
    return selected
}

function getDateOfBirth(formData: FormData, key: string, errors: Record<string, string>): string {
    const value = getText(formData, key, errors, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        errors[key] = 'Enter a valid date of birth.'
        return value
    }
    const parsed = new Date(`${value}T00:00:00.000Z`)
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
        errors[key] = 'Enter a valid date of birth.'
    } else if (value > new Date().toISOString().slice(0, 10)) {
        errors[key] = 'Date of birth cannot be in the future.'
    } else if (value < '1900-01-01') {
        errors[key] = 'Enter a realistic date of birth.'
    }
    return value
}

export function isUnder18(dateOfBirth: string, now = new Date()): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return false
    const birthDate = new Date(`${dateOfBirth}T00:00:00.000Z`)
    if (Number.isNaN(birthDate.getTime()) || birthDate.toISOString().slice(0, 10) !== dateOfBirth) return false
    const eighteenthBirthday = new Date(birthDate)
    eighteenthBirthday.setUTCFullYear(eighteenthBirthday.getUTCFullYear() + 18)
    return eighteenthBirthday.toISOString().slice(0, 10) > now.toISOString().slice(0, 10)
}

function validatePlayer(formData: FormData): ValidationResult {
    const errors: Record<string, string> = {}
    const dateOfBirth = getDateOfBirth(formData, 'dateOfBirth', errors)
    const sport = getChoice<string>(formData, 'sport', sports, errors)
    const gender = getChoice<'female' | 'male'>(formData, 'gender', new Set(['female', 'male']), errors)
    const region = getChoice<string>(formData, 'region', regions, errors)
    const district = getText(formData, 'district', errors, 120)
    const primaryPosition = getText(formData, 'primaryPosition', errors, 100)
    const secondaryPosition = getOptionalText(formData, 'secondaryPosition', errors, 100)
    const dominantSide = getChoice<'right' | 'left' | 'both'>(formData, 'dominantSide', new Set(['right', 'left', 'both']), errors)
    const experienceLevel = getChoice<'park' | 'school' | 'district' | 'academy' | 'none'>(formData, 'experienceLevel', experienceLevels, errors)
    const community = getOptionalText(formData, 'community', errors, 120)
    const school = getOptionalText(formData, 'school', errors, 160)
    const jerseyNumber = getInteger(formData, 'jerseyNumber', errors, 0, 99)
    const heightCm = getInteger(formData, 'heightCm', errors, 100, 260)
    const weightKg = getDecimal(formData, 'weightKg', errors, 25, 300)
    const yearsPlaying = getInteger(formData, 'yearsPlaying', errors, 0, 80)
    const previousClub = getOptionalText(formData, 'previousClub', errors, 160)
    const bio = getOptionalText(formData, 'bio', errors, 2000)
    const goals = getOptionalText(formData, 'goals', errors, 1000)
    const highlightUrl = getOptionalText(formData, 'highlightUrl', errors, 2048)
    const achievements = getOptionalText(formData, 'achievements', errors, 2000)
    const minor = isUnder18(dateOfBirth)
    const consentParticipation = getBoolean(formData, 'consentParticipation', errors, !minor)
    const consentMedia = getBoolean(formData, 'consentMedia', errors, !minor)
    const consentSafeguarding = getBoolean(formData, 'consentSafeguarding', errors, !minor)
    const consentFinancial = getBoolean(formData, 'consentFinancial', errors, !minor)
    const consentDiscovery = getBoolean(formData, 'consentDiscovery', errors, false)
    const inviteTokenValue = getText(formData, 'guardianInviteToken', errors, 43)
    const guardianInviteToken = inviteTokenValue || null

    if (!district) errors.district = 'This field is required.'
    if (!positionsBySport[sport]?.has(primaryPosition)) errors.primaryPosition = 'Choose a position for the selected sport.'
    if (secondaryPosition && !positionsBySport[sport]?.has(secondaryPosition)) {
        errors.secondaryPosition = 'Choose a position for the selected sport.'
    }
    if (secondaryPosition && secondaryPosition === primaryPosition) errors.secondaryPosition = 'Choose a different secondary position.'
    if (highlightUrl) {
        try {
            const url = new URL(highlightUrl)
            if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid URL')
        } catch {
            errors.highlightUrl = 'Enter a valid http or https video URL.'
        }
    }
    if (minor && guardianInviteToken) errors.guardianInviteToken = 'A player invite is generated after submission; this field is not accepted.'
    if (!minor && guardianInviteToken) errors.guardianInviteToken = 'Guardian invite tokens are only used for under-18 accounts.'

    if (Object.keys(errors).length) return { success: false, fieldErrors: errors }
    return {
        success: true,
        data: {
            role: 'player',
            value: {
                dateOfBirth,
                sport,
                gender: gender as 'female' | 'male',
                region,
                district,
                community,
                school,
                primaryPosition,
                secondaryPosition,
                dominantSide: dominantSide as 'right' | 'left' | 'both',
                jerseyNumber,
                heightCm,
                weightKg,
                experienceLevel: experienceLevel as PlayerOnboardingInput['experienceLevel'],
                yearsPlaying,
                previousClub,
                bio,
                goals,
                highlightUrl,
                achievements,
                consentParticipation,
                consentMedia,
                consentSafeguarding,
                consentFinancial,
                consentDiscovery,
                guardianInviteToken,
            },
        },
    }
}

function validateScout(formData: FormData): ValidationResult {
    const errors: Record<string, string> = {}
    const dateOfBirth = getDateOfBirth(formData, 'dateOfBirth', errors)
    const phone = getText(formData, 'phone', errors, 30)
    const nationality = getOptionalText(formData, 'nationality', errors, 80)
    const regionValue = getChoice<string>(formData, 'region', regions, errors, false)
    const organisation = getText(formData, 'organisation', errors, 160)
    const scoutRole = getChoice<ScoutOnboardingInput['scoutRole']>(formData, 'scoutRole', scoutRoles, errors)
    const affiliationType = getChoice<ScoutOnboardingInput['affiliationType']>(formData, 'affiliationType', affiliations, errors)
    const yearsExperience = getInteger(formData, 'yearsExperience', errors, 0, 80)
    const referenceName = getText(formData, 'referenceName', errors, 120)
    const referenceContact = getText(formData, 'referenceContact', errors, 160)
    const selectedSports = getMultiChoice(formData, 'sports', sports, errors, true)
    const selectedPositions = getMultiChoice(formData, 'positions', new Set(Object.values(positionsBySport).flatMap(items => [...items])), errors, false)
    const selectedAgeBands = getMultiChoice(formData, 'ageBands', ageBands, errors, true)
    const selectedRegions = getMultiChoice(formData, 'regions', regions, errors, false)
    const consentScoutCode = getBoolean(formData, 'consentScoutCode', errors, true)
    const consentBackgroundCheck = getBoolean(formData, 'consentBackgroundCheck', errors, true)
    const consentNoContactPolicy = getBoolean(formData, 'consentNoContactPolicy', errors, true)

    if (!/^[+\d][\d\s()-]{6,29}$/.test(phone)) errors.phone = 'Enter a valid phone number.'
    if (selectedPositions.some(position => !selectedSports.some(sport => positionsBySport[sport]?.has(position)))) {
        errors.positions = 'Choose positions from the sports you selected.'
    }

    if (Object.keys(errors).length) return { success: false, fieldErrors: errors }
    return {
        success: true,
        data: {
            role: 'scout',
            value: {
                dateOfBirth,
                phone,
                nationality,
                region: regionValue || null,
                organisation,
                scoutRole: scoutRole as ScoutOnboardingInput['scoutRole'],
                affiliationType: affiliationType as ScoutOnboardingInput['affiliationType'],
                yearsExperience,
                referenceName,
                referenceContact,
                sports: selectedSports,
                positions: selectedPositions,
                ageBands: selectedAgeBands,
                regions: selectedRegions,
            },
        },
    }
}

function validateGuardian(formData: FormData): ValidationResult {
    const errors: Record<string, string> = {}
    const relationship = getChoice<GuardianOnboardingInput['relationship']>(formData, 'relationship', relationships, errors)
    const phone = getText(formData, 'phone', errors, 30)
    const secondaryPhone = getOptionalText(formData, 'secondaryPhone', errors, 30)
    const region = getChoice<string>(formData, 'region', regions, errors)
    const address = getText(formData, 'address', errors, 300)
    const emergencyContactName = getText(formData, 'emergencyContactName', errors, 120)
    const emergencyContactPhone = getText(formData, 'emergencyContactPhone', errors, 30)
    const medicalNotes = getOptionalText(formData, 'medicalNotes', errors, 2000)
    const inviteValue = getText(formData, 'inviteToken', errors, 43)
    const inviteToken = inviteValue || null

    if (!/^[+\d][\d\s()-]{6,29}$/.test(phone)) errors.phone = 'Enter a valid phone number.'
    if (secondaryPhone && !/^[+\d][\d\s()-]{6,29}$/.test(secondaryPhone)) errors.secondaryPhone = 'Enter a valid phone number.'
    if (!/^[+\d][\d\s()-]{6,29}$/.test(emergencyContactPhone)) errors.emergencyContactPhone = 'Enter a valid phone number.'
    if (inviteToken && !inviteTokenPattern.test(inviteToken)) errors.inviteToken = 'This guardian invitation is invalid.'

    if (Object.keys(errors).length) return { success: false, fieldErrors: errors }
    return {
        success: true,
        data: {
            role: 'guardian',
            value: {
                relationship: relationship as GuardianOnboardingInput['relationship'],
                phone,
                secondaryPhone,
                region,
                address,
                emergencyContactName,
                emergencyContactPhone,
                medicalNotes,
                inviteToken,
            },
        },
    }
}

export function validateOnboardingForm(role: AccountRole, formData: FormData): ValidationResult {
    if (role === 'player') return validatePlayer(formData)
    if (role === 'scout') return validateScout(formData)
    if (role === 'guardian') return validateGuardian(formData)
    return { success: false, fieldErrors: { form: 'This account role cannot submit onboarding.' } }
}
