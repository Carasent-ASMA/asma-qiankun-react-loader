/**
 * Route a qiankun micro-app's lifecycle failure back to the host that rendered it (ASMA-7853).
 *
 * qiankun mounts imperatively into a container div, from a promise chain that nothing awaited:
 * `resolveMicroAppLoader` caught bootstrap failures into `console.error`, and `mountPromise` had no
 * catch at all. So the two failures that matter looked identical to the user — the placeholder text
 * the host passed in, forever — while the actual cause sat in the console as an unhandled rejection.
 *
 * A React error boundary cannot close this gap. The widget lives OUTSIDE the host's render tree (its
 * own qiankun sandbox, its own root), so nothing it throws passes through a boundary in the host.
 * Carrying the error back through state is the only route, and this is the seam that does it.
 *
 * Deliberately pure and DOM-free: it takes the two promises and a reporter, so it is testable
 * without React, jsdom or a running qiankun — which is the whole reason it is not inlined in the
 * component's effect.
 *
 * The case this was written for: an app whose entry loads but registers NO qiankun lifecycle. The
 * shell then hands qiankun its placeholder lifecycle, whose `mount()` throws by design with a
 * message naming the app — and that message is exactly what has been going nowhere.
 */

/** The lifecycle handles this module needs — the subset of qiankun's `MicroApp` that can reject. */
export interface MicroAppLifecycle {
    bootstrapPromise: Promise<unknown>
    mountPromise: Promise<unknown>
}

/**
 * Report the FIRST lifecycle failure of one micro-app; returns a cancel function for unmount.
 *
 * First-error-wins on purpose: single-spa marks a broken app `SKIP_BECAUSE_BROKEN`, after which
 * both promises reject with the same underlying failure. Reporting twice would make one broken
 * widget look like two, and would re-render the host for no new information.
 *
 * Both promises are always attached, even though a bootstrap failure usually implies a mount
 * failure: the ASMA-7853 case bootstraps CLEANLY (the placeholder's `bootstrap()` only warns) and
 * fails at mount. Watching only the first one would have missed the very failure this exists for.
 */
export function reportFirstMicroAppFailure(app: MicroAppLifecycle, report: (error: unknown) => void): () => void {
    let settled = false

    const reportOnce = (error: unknown) => {
        if (settled) return
        settled = true
        report(error)
    }

    // `catch` (not `then(…, …)`) so a rejection is HANDLED rather than merely observed — an
    // unhandled-rejection storm in the console is what buried the real message in the first place.
    void app.bootstrapPromise.catch(reportOnce)
    void app.mountPromise.catch(reportOnce)

    return () => {
        settled = true
    }
}
