import { useEffect, useRef, useState } from 'react'

import type { MicroApp, ObjectType } from 'asma-qiankun'

import { incrementOccurrence, initLoadMicroApp, removeLoaderToResolve, type IMfComponentLoader } from './LoaderQueue'
import { isEsmMarkedApp, overrideBaseFor, resolveTransport, type Transport } from './esmTransport'
import { healOverrideIfVersionIsGone } from './overrideSelfHeal'


function MfComponentLoaderInternal<T extends ObjectType>({
    app,
    props,
    className,
    disableWrapperStyles,
    placeholder = 'mf original',
    LoaderComponent,
    controller: _controller,
    onMounted,
}: IMfComponentLoader<T>) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState(false)
    const [loadedApp, setLoadedApp] = useState<MicroApp | undefined>()
    const occurrenceRef = useRef<number | undefined>(0)

    const status = loadedApp?.getStatus()

    loadedApp?.mountPromise.then(onMounted)
    const mounted = status === 'MOUNTED'

    useEffect(() => {
        if (!loadedApp || loading || !mounted || !loadedApp?.update) return

        loadedApp?.update({
            ...props,
            occurence: occurrenceRef.current,
            occurrence: occurrenceRef.current,
            container: containerRef.current!,
        })
    }, [props, loadedApp, loading, mounted])

    useEffect(() => {
        if (!app) {
            console.error('No micro app was provided! microapp components wont render!`')
            return
        }
        let currentController = _controller || new AbortController()

        if (currentController.signal.aborted) {
            console.warn(
                `MfComponentLoaderInternal: controller signal is aborted, reason: ${currentController.signal.reason} resetting controller!`,
            )
            currentController = new AbortController()
        }

        occurrenceRef.current = incrementOccurrence(app.name + props.component_path)

        let loadedapp: MicroApp | undefined //= loadASMAMicroAPP(app, props, containerRef)

        setLoading(true)

        initLoadMicroApp({
            app,
            props: {
                ...props,
                occurence: occurrenceRef.current,
                occurrence: occurrenceRef.current,
            },
            containerRef,
            setLoadedApp: (lApp) => {
                loadedapp = lApp
                setLoading(false)
                setLoadedApp(lApp)
            },
            controller: currentController,
        })

        return () => {
            //const loader = LoaderQueue[app.name]?.find((l) => l.id === props.component_path)

            if (!currentController.signal.aborted) {
                currentController.abort(
                    `unmounting MfComponentLoaderInternal for service: ${app.name} path: ${props.component_path}!`,
                )
            }

            /*    loadedapp =
                loadedapp ||
                loader?.micro_app ||
                LoaderQueue[app.name]?.find((l) => l.id === props.component_path)?.init() */

            loadedapp?.unmount()

            removeLoaderToResolve(app.name, props.component_path)
        }
    }, [])

    let wrapperClass = className

    if (!disableWrapperStyles) {
        wrapperClass = '__asma_microapp_wrapper__' + (wrapperClass ? ` ${wrapperClass}` : '')
    }

    // if (pending) {
    // return <div>pending... {placeholder}</div>
    // }
    return (
        <div ref={containerRef} className={wrapperClass}>
            {(loading && ((LoaderComponent && <LoaderComponent />) || null)) || placeholder}
        </div>
    )
}
export function MfComponentLoader<T extends ObjectType>(props: IMfComponentLoader<T>) {
    // ASMA-7544 transport gate — an app that resolves to native-ESM must be mounted via
    // <EsmWidgetHost> (asma-mfw-esmloader), NEVER through qiankun's import-html-entry: qiankun runs the
    // entry in the host document, so the ESM build's relative chunk imports resolve against the origin
    // (`/chunks/…`) instead of `/cdn/<app>/<ver>/chunks/…` → the static server's SPA fallback answers
    // `index.html` (text/html) → "Expected a JavaScript-or-Wasm module script" MIME failure. This gate
    // is the app-level counterpart to the dual loader and retires qiankun per app as each ships ESM.
    //
    // Synchronous for released (`esm`-marked) apps and for normal qiankun apps (no override) → zero
    // extra render/round-trip. A one-shot `widgets.json` probe runs ONLY for a dev-overridden app (the
    // transport-ambiguous case): a real manifest ⇒ ESM (stand down); a 404/SPA-fallback ⇒ a genuine
    // qiankun dev server ⇒ proceed. Hooks are called unconditionally (before the `!app` guard) per the
    // Rules of Hooks.
    const appName = props.app?.name
    const [transport, setTransport] = useState<Transport | 'checking'>(() =>
        appName && isEsmMarkedApp(appName) ? 'esm' : appName && overrideBaseFor(appName) ? 'checking' : 'qiankun',
    )
    useEffect(() => {
        if (!appName || transport !== 'checking') return
        let cancelled = false
        void resolveTransport(appName).then(async (t) => {
            // ASMA-7866. The gate has just said "this override is not an ESM build" — but for a
            // PUBLISHED base that is also exactly what a DELETED version looks like, because the CDN
            // is the object store itself and answers 403 for any key it does not hold, including a
            // `widgets.json` that a healthy qiankun version never had either. So before mounting
            // qiankun against a base that may be gone, check the entry document, which only a live
            // version serves. If it is provably gone the override is cleared and the page reloads;
            // there is nothing left for this component to render. The check is deliberately not
            // skipped on unmount: whether the version exists is a fact about the page, not about
            // this one widget, and the next mount would only pay for it again.
            const overrideBase = t === 'qiankun' ? overrideBaseFor(appName) : undefined
            if (overrideBase && (await healOverrideIfVersionIsGone(appName, overrideBase))) return
            if (!cancelled) setTransport(t)
        })
        return () => {
            cancelled = true
        }
    }, [appName, transport])

    if (!props.app) {
        console.error(
            `No micro app with path '${props.props.component_path}' was provied! microapp components wont render!`,
        )

        return <div>No micro app `adopus-app-directory` was provied!</div>
    }

    if (transport === 'esm') {
        // Native-ESM app — <EsmWidgetHost> owns it; qiankun stands down (rendering the same widget here
        // via import-html-entry is the origin-`/chunks/` bug). No visual gap: the dual loader renders
        // EsmWidgetHost for the same mount.
        console.warn(
            `MfComponentLoader: '${props.app.name}' is native-ESM — skipping qiankun mount (load via EsmWidgetHost / asma-mfw-esmloader).`,
        )
        return null
    }
    if (transport === 'checking') {
        // Probing a dev-override's widgets.json (dev-only, one round-trip). Show the caller's placeholder.
        return (
            <div className={props.className}>
                {(props.LoaderComponent && <props.LoaderComponent />) || props.placeholder || null}
            </div>
        )
    }

    return <MfComponentLoaderInternal app={props.app} {...props} />
}

export default MfComponentLoader
