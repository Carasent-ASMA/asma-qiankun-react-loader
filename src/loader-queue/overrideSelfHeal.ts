/**
 * Self-heal a dev override that points at a published version which no longer exists (ASMA-7866) —
 * the qiankun half.
 *
 * A tester pins a `pr<N>` preview through the import-map-overrides convention. When that preview is
 * deleted on merge (ASMA-7863) the override outlives it, and every later load of that app fails
 * identically. Nothing the tester can do brings the version back and no server-side grace period
 * helps, so the fix has to live where the override lives — the client. The ESM loader
 * (`asma-mfw-esmloader`) does this in `EsmWidgetHost`; widgets that still mount through qiankun do
 * not pass through there, which is what this covers.
 *
 * WHY THE ENTRY DOCUMENT AND NOT `widgets.json`
 * The transport gate already probes `<base>widgets.json`, but its answer cannot be reused here: the
 * CDN is the object store itself, which answers 403 for ANY key it does not hold, and a perfectly
 * healthy published QIANKUN version holds no `widgets.json` either. The two cases are
 * indistinguishable on that path. The entry document is the discriminator — a live version serves
 * it, a deleted prefix does not — and it is also exactly what qiankun is about to fetch.
 *
 * WHAT COUNTS AS PROOF
 * Only 404 and 403 (the object store's answer for a missing key, since the anonymous reader has no
 * ListBucket permission — verified against the dev origin, which returns 403 AccessDenied for every
 * path under a prefix that does not exist). A 5xx, a timeout or a network failure means unreachable,
 * not gone, and must never discard a deliberate setting. A LOCALHOST override is excluded for the
 * same reason: a dev server that is not running is recoverable by starting it.
 *
 * DUPLICATION IS DELIBERATE. The localStorage keys and the local-base rule are twins of
 * `asma-mfw-esmloader`'s `platformSignal.ts`. This package must not import that one (see
 * `esmTransport.ts`), and it already duplicates the two override keys for the same reason. The
 * record key in particular is a contract with the host, which reads it with a single
 * `consumeOverrideSelfHeal()` call whichever transport wrote it — `assertsSelfHealKeyContract` below
 * exists so a rename on either side fails a test rather than silently losing the message.
 */

/** Twin of `asma-mfw-esmloader`'s key — see the note above. */
export const OVERRIDE_SELF_HEAL_KEY = 'asma-override-self-heal'
const OVERRIDES_DISABLED_KEY = 'import-map-overrides-disabled'

/** The environment this module touches, injectable so the decisions above are testable. */
export interface OverrideHealEnv {
    fetch: (url: string) => Promise<{ status: number }>
    storage: Pick<Storage, 'getItem' | 'setItem'>
    reload: () => void
}

function browserEnv(): OverrideHealEnv {
    const w = (window as unknown as { rawWindow?: typeof window }).rawWindow || window
    return {
        fetch: (url) => w.fetch(url),
        storage: w.localStorage,
        reload: () => w.location.reload(),
    }
}

/**
 * Is this override base a developer's own machine rather than a published version? Parsed as a URL,
 * not matched as a substring — `https://localhost.example.com/` is a published host that merely
 * reads like one.
 */
export function isLocalOverrideBase(base: string): boolean {
    try {
        const { hostname } = new URL(base, 'http://localhost')
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1'
    } catch {
        return false
    }
}

/** Does this response status PROVE the version is gone, as opposed to merely unreachable? */
export function provesVersionIsGone(status: number): boolean {
    return status === 404 || status === 403
}

/**
 * Add the app to the overrides widget's disabled list. Same list the widget itself writes, so the
 * tester can see what happened and undo it there.
 */
function disableOverride(storage: OverrideHealEnv['storage'], appName: string): void {
    let disabled: string[] = []
    try {
        const parsed: unknown = JSON.parse(storage.getItem(OVERRIDES_DISABLED_KEY) ?? '[]')
        if (Array.isArray(parsed)) disabled = parsed as string[]
    } catch {
        // a malformed list is reset rather than inherited — it disables nothing today anyway
    }
    if (!disabled.includes(appName)) disabled.push(appName)
    storage.setItem(OVERRIDES_DISABLED_KEY, JSON.stringify(disabled))
}

/** Only the first heal of a page load reloads; later mounts of other widgets must not pile on. */
let healing = false

/** Test seam — the flag is module state that would otherwise leak between cases. */
export function resetSelfHealForTests(): void {
    healing = false
}

/**
 * Clear `appName`'s override and reload, but only on proof that its base is gone. Returns whether it
 * healed, so the caller knows a reload is coming and can stop rendering a doomed mount.
 *
 * Self-terminating: the disabled list removes the override from the next resolution, so the reloaded
 * page takes the ordinary path and never gets back here.
 */
export async function healOverrideIfVersionIsGone(
    appName: string,
    base: string,
    env: OverrideHealEnv = browserEnv(),
): Promise<boolean> {
    if (healing || isLocalOverrideBase(base)) return false

    let status: number
    try {
        status = (await env.fetch(base)).status
    } catch {
        return false // unreachable is not gone
    }
    if (!provesVersionIsGone(status)) return false
    if (healing) return false // another widget's probe won the race while this one was in flight

    healing = true
    try {
        env.storage.setItem(OVERRIDE_SELF_HEAL_KEY, JSON.stringify({ appName, base }))
    } catch {
        // storage blocked — the heal still happens, only the explanation is lost
    }
    disableOverride(env.storage, appName)
    env.reload()
    return true
}
