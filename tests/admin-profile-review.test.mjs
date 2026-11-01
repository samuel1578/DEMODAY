import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

async function loadTypeScriptModule(path) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText
    return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
}

const review = await loadTypeScriptModule('../lib/admin-profile-review.ts')
const dashboard = await loadTypeScriptModule('../lib/dashboard.ts')
const account = (role, overrides = {}) => ({
    role,
    status: 'pending',
    first_name: 'Amara',
    last_name: 'Mensah',
    created_at: '2026-10-15T10:00:00.000Z',
    ...overrides,
})

function consent(overrides = {}) {
    return {
        consentType: 'participation',
        decision: 'granted',
        recordedAt: '2026-10-15T10:00:00.000Z',
        ...overrides,
    }
}

test('player review is role-specific and exposes only an age band, never birth or private details', () => {
    const result = review.buildAdminProfileSubmissionReview({
        account: account('player'),
        player: {
            sport: 'football', region: 'Greater Accra', primary_position: 'centre-back',
            secondary_position: null, dominant_side: 'right', experience_level: 'academy',
            years_playing: 4, previous_club: 'Harbour FC', bio: 'A concise bio',
            goals: 'Improve distribution', highlight_url: 'https://example.test/highlight',
            achievements: 'Regional finalist', isMinor: true,
            date_of_birth: '2009-05-10', phone: '+233-PRIVATE', district: 'PRIVATE-DISTRICT',
        },
        consentStates: [consent()],
    })

    assert.equal(result.roleLabel, 'Athlete')
    assert.deepEqual(result.steps.map(step => step.id), ['athlete-profile', 'story-and-goals', 'consents', 'submitted-images'])
    assert.ok(result.steps[0].fields.some(field => field.label === 'Safeguarding age band' && field.value === 'Under 18'))
    assert.equal(result.steps[1].fields.find(field => field.label === 'Highlight video').href, 'https://example.test/highlight')
    assert.doesNotMatch(JSON.stringify(result), /2009-05-10|\+233-PRIVATE|PRIVATE-DISTRICT|date_of_birth|actor_user_id|user_id/)
})

test('scout review maps interests and safeguarding consents while ignoring private scout fields', () => {
    const result = review.buildAdminProfileSubmissionReview({
        account: account('scout'),
        scout: {
            nationality: 'Ghanaian', region: 'Ashanti', organisation: 'Example Academy',
            scout_role: 'club-official', affiliation_type: 'club-academy', years_experience: 8,
            vetting_status: 'reviewed', date_of_birth: 'PRIVATE-DOB', phone: 'PRIVATE-PHONE',
            reference_name: 'PRIVATE-REFERENCE', reference_contact: 'PRIVATE-CONTACT',
        },
        scoutInterests: [
            { user_id: 'PRIVATE-USER', interest_type: 'sport', interest_value: 'football' },
            { user_id: 'PRIVATE-USER', interest_type: 'age_band', interest_value: 'u18' },
        ],
        consentStates: [consent({ consentType: 'scout_code' }), consent({ consentType: 'background_check' })],
    })

    assert.deepEqual(result.steps.map(step => step.id), ['professional-profile', 'scouting-interests', 'safeguarding-consents', 'submitted-images'])
    assert.ok(result.steps[1].fields.some(field => field.label === 'Sports covered' && field.value === 'football'))
    assert.equal(result.steps[2].consents.length, 2)
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE-DOB|PRIVATE-PHONE|PRIVATE-REFERENCE|PRIVATE-CONTACT|PRIVATE-USER/)
})

test('guardian review includes only relationship and region', () => {
    const result = review.buildAdminProfileSubmissionReview({
        account: account('guardian'),
        guardian: {
            relationship: 'parent', region: 'Central', phone: 'PRIVATE-PHONE', address: 'PRIVATE-ADDRESS',
            emergency_contact_name: 'PRIVATE-EMERGENCY', medical_notes: 'PRIVATE-MEDICAL',
        },
    })

    assert.deepEqual(result.steps.map(step => step.id), ['guardian-profile', 'submitted-images'])
    assert.deepEqual(result.steps[0].fields, [
        { label: 'Relationship to athlete', value: 'parent' },
        { label: 'Region', value: 'Central' },
    ])
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE-PHONE|PRIVATE-ADDRESS|PRIVATE-EMERGENCY|PRIVATE-MEDICAL/)
})

test('latest consent revision is reduced to a safe per-type state without actor identifiers', () => {
    const latest = dashboard.latestConsentStates([
        { id: 'old', actor_user_id: 'ACTOR-OLD', subject_user_id: 'SUBJECT', consent_type: 'media', decision: 'granted', consent_version: '1', recorded_at: '2026-01-01', consent_revision: 1 },
        { id: 'new', actor_user_id: 'ACTOR-NEW', subject_user_id: 'SUBJECT', consent_type: 'media', decision: 'withdrawn', consent_version: '2', recorded_at: '2026-02-01', consent_revision: 2 },
    ])
    const result = review.buildAdminProfileSubmissionReview({
        account: account('player'),
        player: {
            sport: 'football', region: 'Central', primary_position: 'forward', secondary_position: null,
            dominant_side: 'left', experience_level: 'school', years_playing: null, previous_club: null,
            bio: null, goals: null, highlight_url: null, achievements: null, isMinor: null,
        },
        consentStates: latest,
    })

    assert.equal(result.steps[2].consents.length, 1)
    assert.equal(result.steps[2].consents[0].decision, 'withdrawn')
    assert.doesNotMatch(JSON.stringify(result), /ACTOR-OLD|ACTOR-NEW|SUBJECT|consent_version/)
})

test('only current, non-deleted, non-rejected profile and action images are eligible', () => {
    const media = [
        { id: 'profile', mediaType: 'profile_photo', status: 'pending', contentType: 'image/jpeg', isCurrent: true, deletedAt: null },
        { id: 'action', mediaType: 'action_photo', status: 'approved', contentType: 'image/webp', isCurrent: true, deletedAt: null },
        { id: 'identity', mediaType: 'identity_document', status: 'pending', contentType: 'image/jpeg', isCurrent: true, deletedAt: null },
        { id: 'rejected', mediaType: 'profile_photo', status: 'rejected', contentType: 'image/jpeg', isCurrent: true, deletedAt: null },
        { id: 'old', mediaType: 'profile_photo', status: 'approved', contentType: 'image/jpeg', isCurrent: false, deletedAt: null },
        { id: 'deleted', mediaType: 'action_photo', status: 'approved', contentType: 'image/jpeg', isCurrent: true, deletedAt: '2026-01-01' },
        { id: 'non-image', mediaType: 'profile_photo', status: 'approved', contentType: 'application/pdf', isCurrent: true, deletedAt: null },
    ]

    assert.deepEqual(review.eligibleProfileReviewMedia(media).map(item => item.id), ['profile', 'action'])
})

test('admin and incomplete accounts get an account-only state', () => {
    const admin = review.buildAdminProfileSubmissionReview({ account: account('admin') })
    const incomplete = review.buildAdminProfileSubmissionReview({ account: account('player') })
    assert.equal(admin.steps.length, 0)
    assert.match(admin.notSubmittedMessage, /Administrator accounts/)
    assert.equal(incomplete.steps.length, 0)
    assert.match(incomplete.notSubmittedMessage, /No completed role-specific/)
})

test('admin contract selects only review-safe role columns and excludes identity documents from profile media', async () => {
    const source = await readFile(new URL('../lib/supabase/data-contract.ts', import.meta.url), 'utf8')
    assert.match(source, /from\('player_private_details'\)\s*\.select\('date_of_birth'\)/)
    assert.match(source, /from\('scout_profiles'\)\s*\.select\('nationality,region,organisation,scout_role,affiliation_type,years_experience,vetting_status'\)/)
    assert.match(source, /from\('guardian_profiles'\)\s*\.select\('relationship,region'\)/)
    assert.match(source, /\.in\('media_type', \['profile_photo', 'action_photo'\]\)\s*\.neq\('status', 'rejected'\)\s*\.eq\('is_current', true\)\s*\.is\('deleted_at', null\)/)
})
