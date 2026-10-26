'use client'

import { useEffect } from 'react'

const legacyProfileKeys = [
    'demoday.profiles',
    'demoday.profile.player',
    'demoday.profile.guardian',
    'demoday.profile.scout',
]
const credentialFields = ['password', 'confirmPassword'] as const

type JsonRecord = Record<string, unknown>

function removeCredentials(value: unknown): { value: unknown; changed: boolean } {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { value, changed: false }
    }

    const record = { ...(value as JsonRecord) }
    let changed = false

    for (const field of credentialFields) {
        if (field in record) {
            delete record[field]
            changed = true
        }
    }

    if (record.values && typeof record.values === 'object' && !Array.isArray(record.values)) {
        const values = { ...(record.values as JsonRecord) }
        for (const field of credentialFields) {
            if (field in values) {
                delete values[field]
                changed = true
            }
        }
        if (changed) record.values = values
    }

    return { value: record, changed }
}

export function LegacyProfileCredentialCleanup() {
    useEffect(() => {
        try {
            for (const key of legacyProfileKeys) {
                const raw = window.localStorage.getItem(key)
                if (!raw) continue

                const parsed: unknown = JSON.parse(raw)
                if (Array.isArray(parsed)) {
                    let changed = false
                    const cleaned = parsed.map(item => {
                        const result = removeCredentials(item)
                        changed ||= result.changed
                        return result.value
                    })
                    if (changed) window.localStorage.setItem(key, JSON.stringify(cleaned))
                } else {
                    const result = removeCredentials(parsed)
                    if (result.changed) window.localStorage.setItem(key, JSON.stringify(result.value))
                }
            }
        } catch {
            // Leave unrelated or malformed browser data untouched.
        }
    }, [])

    return null
}
