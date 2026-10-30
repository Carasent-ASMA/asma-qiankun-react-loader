import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

import {
    healOverrideIfVersionIsGone,
    isLocalOverrideBase,
    OVERRIDE_SELF_HEAL_KEY,
    provesVersionIsGone,
    resetSelfHealForTests,
    type OverrideHealEnv,
} from './overrideSelfHeal.ts'

const g = globalThis as { location?: unknown; window?: unknown }
beforeEach(() => resetSelfHealForTests())
afterEach(() => {
    delete g.location
    delete g.window
})

/**
 * `status` answers every probe alike; a map answers per exact URL, and anything it does not list is a
 * network failure.
 */
function fakeEnv(status: number | Error | Record<string, number>, items: Record<string, string> = {}) {
    let reloads = 0
    let probed = ''
    const requested: string[] = []
    const env: OverrideHealEnv = {
        fetch: (url) => {
            probed = url
            requested.push(url)
            if (status instanceof Error) return Promise.reject(status)
            if (typeof status === 'number') return Promise.resolve({ status })
            const answer = status[url]
            return answer === undefined ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve({ status: answer })
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
        requested,
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

    it("treats a RELATIVE base — the overrides dialog's format — as the page's own origin (ASMA-8735)", () => {
        g.location = { origin: 'https://avansas.dev.adopus.no' }
        assert.equal(isLocalOverrideBase('/cdn/asma-app-chat/pr166/'), false)

        g.location = { origin: 'http://localhost:5173' }
        assert.equal(isLocalOverrideBase('/cdn/asma-app-chat/pr166/'), true)
    })

    it('does not call a relative base local when there is no page to resolve it against', () => {
        assert.equal(isLocalOverrideBase('/cdn/asma-app-chat/pr166/'), false)

        // An opaque origin (sandboxed iframe, file://) reads as the string "null" — no base at all.
        g.location = { origin: 'null' }
        assert.equal(isLocalOverrideBase('/cdn/asma-app-chat/pr166/'), false)
        assert.equal(isLocalOverrideBase('http://localhost:3003/'), true)
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
    it('asks for BOTH the entry document and widgets.json — each kind of live version lacks one (ASMA-8735)', async () => {
        const f = fakeEnv(403)
        await healOverrideIfVersionIsGone('asma-app-chat', GONE, f.env)
        assert.deepEqual([...f.requested].sort(), [GONE, `${GONE}widgets.json`])
    })

    it('keeps a live qiankun version (entry, no manifest) and a live ESM-only one (manifest, no entry)', async () => {
        for (const statuses of [
            { [GONE]: 200, [`${GONE}widgets.json`]: 403 },
            { [GONE]: 403, [`${GONE}widgets.json`]: 200 },
        ]) {
            resetSelfHealForTests()
            const f = fakeEnv(statuses)
            assert.equal(await healOverrideIfVersionIsGone('asma-app-chat', GONE, f.env), false, JSON.stringify(statuses))
            assert.equal(f.reloads, 0)
            assert.deepEqual(f.items, {})
        }
    })

    it('never clears on half a proof — the entry gone but the manifest unreachable', async () => {
        // The transport gate reads a 5xx manifest as "not ESM" and hands over; the entry of an
        // ESM-only version then answers 403. That pair is no proof.
        for (const statuses of [{ [GONE]: 403, [`${GONE}widgets.json`]: 503 }, { [GONE]: 403 }]) {
            resetSelfHealForTests()
            const f = fakeEnv(statuses)
            assert.equal(await healOverrideIfVersionIsGone('asma-app-chat', GONE, f.env), false, JSON.stringify(statuses))
            assert.equal(f.reloads, 0)
        }
    })

    it("heals a dead RELATIVE override against the page's origin", async () => {
        g.location = { origin: 'https://web.dev.adopus.no' }
        const f = fakeEnv({ [GONE]: 404, [`${GONE}widgets.json`]: 403 })
        assert.equal(await healOverrideIfVersionIsGone('asma-app-chat', '/cdn/asma-app-chat/pr41/', f.env), true)
        assert.deepEqual(JSON.parse(f.items[OVERRIDE_SELF_HEAL_KEY]!), {
            appName: 'asma-app-chat',
            base: '/cdn/asma-app-chat/pr41/',
        })
        assert.equal(f.reloads, 1)
    })

    it('neither asks nor heals when the base cannot be resolved at all', async () => {
        // No answer is no proof — `[].every()` would otherwise read as "everything proved gone".
        for (const base of ['https://', '/cdn/asma-app-chat/pr41/']) {
            resetSelfHealForTests()
            const f = fakeEnv(403)
            assert.equal(await healOverrideIfVersionIsGone('asma-app-chat', base, f.env), false, base)
            assert.deepEqual(f.requested, [], base)
            assert.equal(f.reloads, 0, base)
        }
    })

    it('asks the origin rather than the HTTP cache when it runs in the browser', async () => {
        const inits: (RequestInit | undefined)[] = []
        const items: Record<string, string> = {}
        let reloads = 0
        g.window = {
            fetch: (_url: string, init?: RequestInit) => {
                inits.push(init)
                return Promise.resolve({ status: 403 })
            },
            localStorage: {
                getItem: (k: string) => items[k] ?? null,
                setItem: (k: string, v: string) => {
                    items[k] = v
                },
            },
            location: {
                reload: () => {
                    reloads++
                },
            },
        }
        assert.equal(await healOverrideIfVersionIsGone('asma-app-chat', GONE), true)
        assert.equal(inits.length, 2)
        for (const init of inits) assert.equal(init?.cache, 'no-store')
        assert.equal(reloads, 1)
    })

    it("asks about the version's own folder even when the base lacks its slash or carries a query", async () => {
        const parent = 'https://web.dev.adopus.no/cdn/asma-app-chat/widgets.json'
        for (const base of [GONE.slice(0, -1), `${GONE}?debug=1#top`]) {
            resetSelfHealForTests()
            const f = fakeEnv({ [GONE]: 403, [`${GONE}widgets.json`]: 200, [parent]: 403 })
            assert.equal(await healOverrideIfVersionIsGone('asma-app-chat', base, f.env), false, base)
            assert.deepEqual([...f.requested].sort(), [GONE, `${GONE}widgets.json`], base)
        }
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
