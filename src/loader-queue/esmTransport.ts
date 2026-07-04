/**
 * ESM-vs-qiankun transport gate for the qiankun component loader (ASMA-7544).
 *
 * An app that has moved to native-ESM widgets must NOT be loaded through qiankun's
 * `import-html-entry`: qiankun executes the entry in the HOST document's context, so the ESM
 * build's relative chunk imports (`../chunks/x.js`) resolve against the document ORIGIN
 * (`/chunks/x.js`) instead of the app's CDN base (`/cdn/<app>/<ver>/chunks/x.js`). Those origin
 * requests fall through the static server's SPA catch-all to `index.html` (`text/html`), and the
 * browser rejects them: "Expected a JavaScript-or-Wasm module script … MIME type text/html".
 *
 * ESM apps are mounted exclusively via `<EsmWidgetHost>` (asma-mfw-esmloader); this gate makes the
 * qiankun loader stand down for them. It is the app-level counterpart to the dual loader's
 * per-widget dispatch, and the mechanism that retires qiankun PER APP as each ships ESM.
 *
 * Kept dependency-free (no `asma-mfw-esmloader` import) so this package stays the one that survives
 * when qiankun is retired.
 */
import { realWindow } from '../registerASMAMicroApps'

interface AsmaPlatform {
    apps?: Record<string, { esm?: boolean }>
}

const OVERRIDE_PREFIX = 'import-map-override:'
const OVERRIDES_DISABLED_KEY = 'import-map-overrides-disabled'

/** The static server marks a released app@version `esm` from its deployed `widgets.json`. Synchronous. */
export function isEsmMarkedApp(appName: string): boolean {
    const platform = (realWindow as unknown as { __ASMA_PLATFORM__?: AsmaPlatform }).__ASMA_PLATFORM__
    return platform?.apps?.[appName]?.esm === true
}

/**
 * The active dev-override base for an app (single-spa `import-map-overrides` convention), honoring the
 * disabled list — or `undefined`. The SAME key drives the qiankun entry (see `registerASMAMicroApps`),
 * which is exactly why an ESM override can leak into a qiankun mount without this gate.
 */
export function overrideBaseFor(appName: string): string | undefined {
    try {
        const ls = realWindow.localStorage
        const base = ls.getItem(OVERRIDE_PREFIX + appName)
        if (!base) return undefined
        const disabledRaw = ls.getItem(OVERRIDES_DISABLED_KEY)
        if (disabledRaw) {
            const disabled = JSON.parse(disabledRaw)
            if (Array.isArray(disabled) && disabled.includes(appName)) return undefined
        }
        return base
    } catch {
        return undefined
    }
}

const probeCache = new Map<string, Promise<boolean>>()

/**
 * Does `<base>widgets.json` serve a real widget manifest (⇒ an ESM build)? A 404, or a 200 that is the
 * SPA `index.html` fallback (⇒ an old-architecture qiankun dev server), is `false`. Cached per URL; a
 * transient failure is not pinned (a later mount can retry). Mirrors the dual loader's own probe.
 */
function baseServesWidgetManifest(base: string): Promise<boolean> {
    const withSlash = base.endsWith('/') ? base : `${base}/`
    const url = new URL('widgets.json', new URL(withSlash, realWindow.location.origin)).href
    let cached = probeCache.get(url)
    if (!cached) {
        cached = realWindow
            .fetch(url)
            .then(async (res) => {
                if (!res.ok) return false
                try {
                    const parsed = (await res.json()) as { widgets?: unknown }
                    return typeof parsed === 'object' && parsed !== null && typeof parsed.widgets === 'object'
                } catch {
                    return false // 200 + index.html (SPA fallback) ⇒ not a manifest ⇒ a genuine qiankun dev server
                }
            })
            .catch(() => false)
        probeCache.set(url, cached)
        void cached.then((ok) => {
            if (!ok && probeCache.get(url) === cached) probeCache.delete(url)
        })
    }
    return cached
}

export type Transport = 'esm' | 'qiankun'

/**
 * Decide the transport for an app before qiankun would load it:
 *  - released ESM (`esm` marker) ⇒ `esm` (synchronous),
 *  - active dev-override ⇒ PROBE `<override base>widgets.json` (a valid manifest ⇒ `esm`; a
 *    404/SPA-fallback ⇒ a genuine qiankun dev server ⇒ `qiankun`),
 *  - otherwise ⇒ `qiankun`.
 */
export async function resolveTransport(appName: string): Promise<Transport> {
    if (isEsmMarkedApp(appName)) return 'esm'
    const overrideBase = overrideBaseFor(appName)
    if (overrideBase) return (await baseServesWidgetManifest(overrideBase)) ? 'esm' : 'qiankun'
    return 'qiankun'
}
