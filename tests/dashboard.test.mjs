import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../lib/dashboard.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const dashboard = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

function consentRecord(overrides) {
    return {
        id: `record-${overrides.consent_revision}`,
        actor_user_id: 'user-1',
        subject_user_id: 'user-1',
        consent_type: 'participation',
        decision: 'granted',
        consent_version: 'v1',
        recorded_at: '2026-10-01T00:00:00.000Z',
        consent_revision: 1,
        ...overrides,
    }
}

test('the newest consent revision wins regardless of row order', () => {
    const states = dashboard.latestConsentStates([
        consentRecord({ consent_type: 'media', decision: 'withdrawn', consent_revision: 5 }),
        consentRecord({ consent_type: 'media', decision: 'granted', consent_revision: 2 }),
        consentRecord({ consent_type: 'participation', decision: 'granted', consent_revision: 1 }),
    ])
    assert.deepEqual(
        states.map(state => [state.consentType, state.decision]),
        [['media', 'withdrawn'], ['participation', 'granted']],
    )
})

test('missing consent types only count current granted decisions', () => {
    const states = dashboard.latestConsentStates([
        consentRecord({ consent_type: 'participation', decision: 'granted', consent_revision: 1 }),
        consentRecord({ consent_type: 'media', decision: 'withdrawn', consent_revision: 3 }),
    ])
    assert.deepEqual(
        dashboard.missingConsentTypes(states, ['participation', 'media', 'safeguarding', 'financial']),
        ['media', 'safeguarding', 'financial'],
    )
    assert.equal(dashboard.consentDecision(states, 'participation'), 'granted')
    assert.equal(dashboard.consentDecision(states, 'safeguarding'), null)
    assert.equal(dashboard.hasAllConsents(states, ['participation']), true)
    assert.equal(dashboard.hasAllConsents(states, ['participation', 'media']), false)
})

test('presentation helpers fall back safely for missing profile data', () => {
    assert.equal(dashboard.accountStatusLabel('active'), 'Active')
    assert.equal(dashboard.accountStatusLabel(null), 'Not available')
    assert.equal(dashboard.profileRoleLabel('player'), 'Athlete')
    assert.equal(dashboard.profileRoleLabel(null), 'Account')
    assert.equal(dashboard.accountDisplayName('Ama', 'Boateng'), 'Ama Boateng')
    assert.equal(dashboard.accountDisplayName(null, null, 'Athlete'), 'Athlete')
    assert.equal(dashboard.formatShortDate(null), 'Not recorded')
    assert.equal(dashboard.humanizeToken('american-football'), 'american football')
})
