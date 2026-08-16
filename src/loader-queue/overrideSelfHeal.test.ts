import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'

import {
    healOverrideIfVersionIsGone,
    isLocalOverrideBase,
    OVERRIDE_SELF_HEAL_KEY,
    provesVersionIsGone,
    resetSelfHealForTests,
    type OverrideHealEnv,
} from './overrideSelfHeal.ts'

beforeEach(() => resetSelfHealForTests())

function fakeEnv(status: number | Error, items: Record<string, string> = {}) {
    let reloads = 0
    let probed = ''
    const env: OverrideHealEnv = {
        fetch: (url) => {
            probed = url
            return status instanceof Error ? Promise.reject(status) : Promise.resolve({ status })
        },
        storage: {
            getItem: (k: string) => items[k] ?? null,
            setItem: (k: string, v: string) => {
                items[k] = v
            },
        },
        reload: () => {
            reloads++
        },
    }
    return {
        env,
        items,
        get reloads() {
            return reloads
        },
        get probed() {
            return probed
        },
    }
}

const GONE = 'https://web.dev.adopus.no/cdn/asma-app-chat/pr41/'

describe('isLocalOverrideBase', () => {
    it('recognises a developer machine on any port or protocol', () => {
        for (const base of ['http://localhost:3003/', 'https://127.0.0.1:8080/', 'http://[::1]:5173/']) {
            assert.equal(isLocalOverrideBase(base), true, base)
        }
    })

    it('does not mistake a published host that merely reads like localhost', () => {
        assert.equal(isLocalOverrideBase('https://localhost.evil.example.com/'), false)
        assert.equal(isLocalOverrideBase(GONE), false)
    })
})

describe('provesVersionIsGone', () => {
    it('accepts 404 and 403 — the object store answers 403 for a key it does not hold', () => {
        assert.equal(provesVersionIsGone(404), true)
        assert.equal(provesVersionIsGone(403), true)
    })

    it('rejects statuses that mean unreachable rather than absent', () => {
        for (const status of [200, 304, 500, 502, 503]) {
            assert.equal(provesVersionIsGone(status), false, String(status))
        }
    })
})

describe('healOverrideIfVersionIsGone', () => {
    it('probes the ENTRY the override points at — not widgets.json, which a live qiankun version also lacks', async () => {
        const f = fakeEnv(403)
        await healOverrideIfVersionIsGone('asma-app-chat', GONE, f.env)
        assert.equal(f.probed, GONE)
    })

    it('clears the override, records why, and reloads when the version is provably gone', async () => {
        const f = fakeEnv(403)
        assert.equal(await healOverrideIfVersionIsGone('asma-app-chat', GONE, f.env), true)

        assert.deepEqual(JSON.parse(f.items['import-map-overrides-disabled']!), ['asma-app-chat'])
        assert.deepEqual(JSON.parse(f.items[OVERRIDE_SELF_HEAL_KEY]!), { appName: 'asma-app-chat', base: GONE })
        assert.equal(f.reloads, 1)
    })

    it('leaves a live published override alone', async () => {
        const f = fakeEnv(200)
        assert.equal(await healOverrideIfVersionIsGone('asma-app-chat', GONE, f.env), false)
        assert.equal(f.reloads, 0)
        assert.deepEqual(f.items, {})
    })

    it('never discards a setting over unreachability — a 5xx or a network failure', async () => {
        for (const outcome of [503, 500, new TypeError('Failed to fetch')] as const) {
            resetSelfHealForTests()
            const f = fakeEnv(outcome)
            assert.equal(await healOverrideIfVersionIsGone('asma-app-chat', GONE, f.env), false, String(outcome))
            assert.equal(f.reloads, 0)
        }
    })

    it('leaves a localhost override alone even when nothing answers — a dev server is restartable', async () => {
        const f = fakeEnv(404)
        assert.equal(await healOverrideIfVersionIsGone('asma-app-chat', 'http://localhost:3002/', f.env), false)
        assert.equal(f.reloads, 0)
        assert.equal(f.probed, '', 'a local base should not even be probed')
    })

    it('reloads once however many widgets of the app hit it at the same time', async () => {
        const f = fakeEnv(403)
        const results = await Promise.all([
            healOverrideIfVersionIsGone('asma-app-chat', GONE, f.env),
            healOverrideIfVersionIsGone('asma-app-chat', GONE, f.env),
            healOverrideIfVersionIsGone('asma-app-chat', GONE, f.env),
        ])
        assert.equal(f.reloads, 1)
        assert.deepEqual(
            results.filter(Boolean).length,
            1,
            'exactly one caller should be told a reload is coming',
        )
    })

    it('appends to an existing disabled list instead of replacing it', async () => {
        const f = fakeEnv(403, { 'import-map-overrides-disabled': '["asma-app-calendar"]' })
        await healOverrideIfVersionIsGone('asma-app-chat', GONE, f.env)
        assert.deepEqual(JSON.parse(f.items['import-map-overrides-disabled']!), ['asma-app-calendar', 'asma-app-chat'])
    })

    it('recovers from a malformed disabled list rather than throwing', async () => {
        const f = fakeEnv(403, { 'import-map-overrides-disabled': 'not-json{' })
        assert.equal(await healOverrideIfVersionIsGone('asma-app-chat', GONE, f.env), true)
        assert.deepEqual(JSON.parse(f.items['import-map-overrides-disabled']!), ['asma-app-chat'])
    })

    it('writes the record under the key the host reads — a contract with asma-mfw-esmloader', () => {
        // The host calls consumeOverrideSelfHeal() once, whichever transport healed. If either side
        // renames this key the message is silently lost, so the literal is pinned here.
        assert.equal(OVERRIDE_SELF_HEAL_KEY, 'asma-override-self-heal')
    })
})
