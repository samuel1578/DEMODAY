import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../lib/admin-overview.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const overview = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

const profile = (role, status) => ({ role, status })
const event = (status, is_spotlight = false) => ({ status, is_spotlight })
const link = (status, expires_at = null) => ({ status, expires_at })

test('summarizes role and account status counts within the loaded profile window', () => {
    const result = overview.summarizeAdminOverview({
        profiles: [profile('player', 'pending'), profile('scout', 'reviewed'), profile('player', 'active')],
        scoutVettings: [{ vetting_status: 'pending' }, { vetting_status: 'approved' }],
        events: [], guardianLinks: [], pendingMedia: 2,
        now: '2026-11-01T00:00:00.000Z',
    })

    assert.equal(result.profiles.loaded, 3)
    assert.equal(result.profiles.capped, false)
    assert.equal(result.profiles.byRole.player, 2)
    assert.equal(result.profiles.byRole.scout, 1)
    assert.equal(result.profiles.byStatus.pending, 1)
    assert.equal(result.profiles.byStatus.active, 1)
    assert.equal(result.profiles.awaitingReview, 2)
    assert.equal(result.scoutVetting.awaitingReview, 1)
    assert.equal(result.pendingMediaLoaded, 2)
})

test('counts event lifecycle and guardian link states, including expired pending requests', () => {
    const result = overview.summarizeAdminOverview({
        profiles: [], scoutVettings: [],
        events: [event('published', true), event('draft'), event('cancelled'), event('completed')],
        guardianLinks: [
            link('pending', '2026-10-31T23:59:00.000Z'),
            link('pending', '2026-11-02T00:00:00.000Z'),
            link('approved'),
            link('revoked'),
        ],
        pendingMedia: 0,
        now: '2026-11-01T00:00:00.000Z',
    })

    assert.equal(result.events.total, 4)
    assert.equal(result.events.byStatus.published, 1)
    assert.equal(result.events.byStatus.cancelled, 1)
    assert.equal(result.events.spotlight, 1)
    assert.equal(result.guardianLinks.byStatus.pending, 2)
    assert.equal(result.guardianLinks.byStatus.approved, 1)
    assert.equal(result.guardianLinks.expiredPending, 1)
})

test('an exactly full profile window is marked as potentially incomplete', () => {
    const result = overview.summarizeAdminOverview({
        profiles: Array.from({ length: 200 }, () => profile('player', 'active')),
        scoutVettings: [], events: [], guardianLinks: [], pendingMedia: 0,
        now: '2026-11-01T00:00:00.000Z',
    })
    assert.equal(result.profiles.loaded, 200)
    assert.equal(result.profiles.capped, true)
})

test('empty data returns zeroed summaries without fixture values', () => {
    const result = overview.summarizeAdminOverview({
        profiles: [], scoutVettings: [], events: [], guardianLinks: [], pendingMedia: 0,
        now: '2026-11-01T00:00:00.000Z',
    })
    assert.equal(result.profiles.loaded, 0)
    assert.equal(result.profiles.capped, false)
    assert.equal(result.events.total, 0)
    assert.equal(result.guardianLinks.total, 0)
    assert.equal(result.pendingMediaLoaded, 0)
})
