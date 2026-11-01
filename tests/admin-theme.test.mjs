import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8')
const adminSurfaces = [
    '../components/admin-dashboard.tsx',
    '../components/dashboards/admin-review.tsx',
    '../components/admin/events-manager.tsx',
    '../components/admin/media-moderation.tsx',
    '../components/admin/guardian-oversight.tsx',
]

for (const file of adminSurfaces) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8')
    test(`${file} opts into shared admin contrast and typography rules`, () => {
        assert.match(source, /className="admin-dashboard\s/)
    })
}

test('explicit light theme sets readable white cards even when OS preference is dark', () => {
    const lightTheme = css.match(/main\[data-theme='light'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    assert.match(lightTheme, /--card:\s*#fff;/)
    assert.match(lightTheme, /--foreground:\s*#172219;/)
    assert.match(css, /main\[data-theme='light'\] \.admin-dashboard \[class\*="text-foreground\/"\]/)
})

test('admin light-mode typography increases small labels without changing card padding', () => {
    assert.match(css, /\.admin-dashboard \.text-xs\s*\{\s*font-size:\s*0\.8125rem/)
    assert.match(css, /\.admin-dashboard \.text-sm\s*\{\s*font-size:\s*0\.9375rem/)
    assert.match(css, /\.admin-dashboard \[class~="text-\[10px\]"\]\s*\{\s*font-size:\s*0\.75rem/)
})
