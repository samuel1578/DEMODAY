import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../lib/media.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const media = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

function declaration(overrides = {}) {
    return { mediaType: 'profile_photo', contentType: 'image/jpeg', byteSize: 1024, ...overrides }
}

test('upload requests are validated against role, type, and size', () => {
    assert.equal(media.parseUploadRequest(declaration(), 'player').ok, true)
    assert.equal(media.parseUploadRequest(declaration(), 'admin').ok, false)
    assert.equal(media.parseUploadRequest(declaration({ mediaType: 'identity_document' }), 'player').ok, false)
    assert.equal(media.parseUploadRequest(declaration({ mediaType: 'identity_document' }), 'scout').ok, true)
    assert.equal(media.parseUploadRequest(declaration({ contentType: 'image/gif' }), 'player').ok, false)
    assert.equal(media.parseUploadRequest(declaration({ byteSize: media.maxImageBytes }), 'player').ok, true)
    assert.equal(media.parseUploadRequest(declaration({ byteSize: media.maxImageBytes + 1 }), 'player').ok, false)
    assert.equal(media.parseUploadRequest(declaration({ byteSize: 0 }), 'player').ok, false)
    assert.equal(media.parseUploadRequest(declaration({ byteSize: 1.5 }), 'player').ok, false)
    assert.equal(media.parseUploadRequest(null, 'player').ok, false)
    assert.equal(media.parseUploadRequest([], 'player').ok, false)
})

test('identity documents are always private and unknown minors stay private', () => {
    assert.equal(media.mediaVisibilityFor('identity_document', false), 'private')
    assert.equal(media.mediaVisibilityFor('identity_document', true), 'private')
    assert.equal(media.mediaVisibilityFor('profile_photo', true), 'private')
    assert.equal(media.mediaVisibilityFor('profile_photo', false), 'public')
    assert.equal(media.requiresSignedUrlsFor('private'), true)
    assert.equal(media.requiresSignedUrlsFor('public'), false)
})

test('R2 upload and private delivery URLs have the required lifetimes', () => {
    assert.equal(media.mediaUploadTtlSeconds, 30 * 60)
    assert.equal(media.mediaDeliveryTtlSeconds, 60 * 60)
})

test('formats upload sizes for people', () => {
    assert.equal(media.formatBytes(media.maxImageBytes), '10.0 MB')
    assert.equal(media.formatBytes(0), '0 MB')
})
