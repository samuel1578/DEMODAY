import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../lib/supabase/onboarding-validation.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const validation = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

function makeForm(fields) {
    const form = new FormData()
    for (const [key, value] of Object.entries(fields)) {
        if (Array.isArray(value)) {
            for (const item of value) form.append(key, item)
        } else if (value !== undefined && value !== null) {
            form.append(key, String(value))
        }
    }
    return form
}

function validPlayer(overrides = {}) {
    return makeForm({
        dateOfBirth: '2000-01-01',
        sport: 'football',
        gender: 'female',
        region: 'Ashanti',
        district: 'Kumasi Metro',
        primaryPosition: 'central-midfield',
        dominantSide: 'right',
        experienceLevel: 'school',
        consentParticipation: 'yes',
        consentMedia: 'yes',
        consentSafeguarding: 'yes',
        consentFinancial: 'yes',
        ...overrides,
    })
}

test('invalid and empty dates are safely treated as not under 18', () => {
    assert.equal(validation.isUnder18(''), false)
    assert.equal(validation.isUnder18('not-a-date'), false)
    assert.equal(validation.isUnder18('2024-02-30'), false)
})

test('age gate uses the eighteenth birthday boundary', () => {
    const now = new Date('2026-10-26T12:00:00.000Z')
    assert.equal(validation.isUnder18('2008-10-27', now), true)
    assert.equal(validation.isUnder18('2008-10-26', now), false)
    assert.equal(validation.isUnder18('2008-10-25', now), false)
})

test('adult player submissions require all four self-consents', () => {
    const result = validation.validateOnboardingForm('player', validPlayer())
    assert.equal(result.success, true)
    assert.equal(result.data.value.consentParticipation, true)
    assert.equal(result.data.value.guardianInviteToken, null)

    const rejected = validation.validateOnboardingForm('player', validPlayer({ consentMedia: undefined }))
    assert.equal(rejected.success, false)
    assert.match(rejected.fieldErrors.consentMedia, /required/i)
})

test('minor player submissions do not accept self-consent in place of guardian approval', () => {
    const result = validation.validateOnboardingForm('player', validPlayer({
        dateOfBirth: '2012-05-04',
        consentParticipation: undefined,
        consentMedia: undefined,
        consentSafeguarding: undefined,
        consentFinancial: undefined,
    }))
    assert.equal(result.success, true)
    assert.equal(result.data.value.consentParticipation, false)
})

test('player positions must be supported by the selected sport', () => {
    const result = validation.validateOnboardingForm('player', validPlayer({
        sport: 'basketball',
        primaryPosition: 'central-midfield',
    }))
    assert.equal(result.success, false)
    assert.match(result.fieldErrors.primaryPosition, /position/i)
})

test('scout interest and safeguarding selections are validated server-side', () => {
    const scout = makeForm({
        dateOfBirth: '1985-02-03',
        phone: '+233 24 000 0000',
        organisation: 'Demo Academy',
        scoutRole: 'scout',
        affiliationType: 'club-academy',
        referenceName: 'Reference Person',
        referenceContact: 'reference@example.org',
        sports: ['football'],
        positions: ['central-midfield'],
        ageBands: ['u18'],
        consentScoutCode: 'yes',
        consentBackgroundCheck: 'yes',
        consentNoContactPolicy: 'yes',
    })
    assert.equal(validation.validateOnboardingForm('scout', scout).success, true)

    scout.set('positions', 'center')
    const rejected = validation.validateOnboardingForm('scout', scout)
    assert.equal(rejected.success, false)
    assert.match(rejected.fieldErrors.positions, /sports/i)
})

test('guardian invitation tokens must match the one-time token format', () => {
    const guardian = makeForm({
        relationship: 'parent',
        phone: '+233 24 000 0000',
        region: 'Greater Accra',
        address: 'Accra',
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: '+233 20 000 0000',
        inviteToken: 'x'.repeat(43),
    })
    assert.equal(validation.validateOnboardingForm('guardian', guardian).success, true)

    guardian.set('inviteToken', 'not-a-token')
    const rejected = validation.validateOnboardingForm('guardian', guardian)
    assert.equal(rejected.success, false)
    assert.match(rejected.fieldErrors.inviteToken, /invalid/i)
})

test('unsupported roles cannot submit onboarding', () => {
    const result = validation.validateOnboardingForm('admin', new FormData())
    assert.equal(result.success, false)
})
