import type { Entry, MicroApp } from 'asma-qiankun'
import { remove } from 'lodash-es'
import type { RefObject } from 'react'
import { loadASMAMicroAPP } from '../loadASMAMicroApp'
import { realWindow } from '../registerASMAMicroApps'

export function removeLoaderToResolve(app_name: string, loader_to_resolve_id: string) {
    remove(LoaderQueue[app_name] || [], (l) => l.id === loader_to_resolve_id)

    if (!LoaderQueue[app_name]?.length) {
        areLoadersInProcess[app_name] = false
    }
}

async function resolveMicroAppLoader(app_name: string, micro_app_loader: ILoader) {
    try {
        micro_app_loader.micro_app = micro_app_loader.init()

        micro_app_loader.controller.signal.onabort = async () => {
            // A broken app rejects here — single-spa refuses to unmount an app it marked
            // SKIP_BECAUSE_BROKEN — and this handler is not awaited by anyone, so a throw would
            // surface as one more unhandled rejection and the queue entry would never be removed.
            // Unmounting is best-effort cleanup; the removal below is the part that must happen.
            try {
                await micro_app_loader.micro_app?.unmount()
            } catch (error) {
                console.warn(`unmount failed for '${app_name}' — the app was probably already broken`, error)
            }
            removeLoaderToResolve(app_name, micro_app_loader.id)
        }

        await micro_app_loader.micro_app?.bootstrapPromise
    } catch (error) {
        console.error('resolveMicroAppLoader error: ', error)
    } finally {
        removeLoaderToResolve(app_name, micro_app_loader.id)
    }
}

export const LoaderQueue: IAppLoaderQueue = {}

export const occurrences: Record<string, number> = {}

export function getOccurrence(app_name: string) {
    const occurrence = occurrences[app_name]

    if (typeof occurrence === 'number') {
        return occurrence
    }

    return
}

export function incrementOccurrence(app_name: string) {
    const occurrence = occurrences[app_name]

    if (typeof occurrence === 'number') {
        return (occurrences[app_name] = occurrence + 1)
    }

    occurrences[app_name] = 0
    return 0
}

function getNewLoaderIndex(app_name: string, loaderId: string): number {
    return LoaderQueue?.[app_name]?.filter((loader) => loader.id.split('___')[1] === loaderId)?.length || 0
}

function registerLoader(app_name: string, loader: ILoader) {
    if (!LoaderQueue[app_name]) {
        LoaderQueue[app_name] = []
    }

    loader.id = `${getNewLoaderIndex(app_name, loader.id)}___${loader.id}`
    LoaderQueue[app_name]!.push(loader)
}

interface IAppLoaderQueue {
    [app_names: string]: ILoader[]
}

interface ILoader {
    id: string
    controller: AbortController
    init: () => MicroApp | undefined
    micro_app?: MicroApp
}

export interface IMfComponentLoader<T> extends Pick<React.HTMLAttributes<HTMLDivElement>, 'className'> {
    app?: { name: string; entry: Entry }
    props: IMicroAppProps<T>
    placeholder?: string
    disableWrapperStyles?: boolean
    LoaderComponent?: () => JSX.Element
    controller?: AbortController
    onMounted?: () => void
    /**
     * Called once if this widget's qiankun lifecycle fails to bootstrap or mount (ASMA-7853).
     *
     * The counterpart to `onMounted`, and the reason it exists: a failure here happens outside the
     * host's React tree — qiankun mounts imperatively into the container div — so no error boundary
     * in the host can see it, and until this prop existed the failure reached only `console.error`.
     * The dual loader (`asma-mfw-esmloader`) passes a handler that renders `<WidgetErrorNotice/>`,
     * giving the qiankun path the same visible error state the ESM path already had.
     */
    onLoadError?: (error: unknown) => void
}

export type IMicroAppProps<T> = { component_path: string } & T

export const areLoadersInProcess = {} as Record<string, boolean>

async function resolveLoaders(app_name: string) {
    areLoadersInProcess[app_name] = true

    while (areLoadersInProcess[app_name]) {
        const loader_to_resolve = LoaderQueue[app_name]?.[0]
        if (loader_to_resolve) {
            await resolveMicroAppLoader(app_name, loader_to_resolve)
        }
    }
}

let initLoadMicroApp: typeof initLoadMicroAppFn

function initLoadMicroAppFn({
    app,
    props,
    containerRef,
    setLoadedApp,
    controller,
}: {
    app: { name: string; entry: Entry }
    props: IMicroAppProps<{}>
    containerRef: RefObject<HTMLDivElement>
    setLoadedApp: (lApp: MicroApp) => void
    controller: AbortController
}) {
    function init() {
        if (controller.signal.aborted) {
            console.warn('init signal aborted: ', controller.signal.aborted, 'reason: ', controller.signal.reason)

            removeLoaderToResolve(app.name, props.component_path)
            return
        }

        const loaded_app = loadASMAMicroAPP(
            {
                name: app.name,
                entry: app.entry,
                container: containerRef.current!,

                props,
            },
            {
                // Cast to `typeof fetch`: qiankun's frameworkConfiguration.fetch type intersects with
                // `typeof fetch`, which @types/node@18.19 gave a required `preconnect` member. We only
                // ever call it as `fetch(url, init)`, so the cast is safe. (Pre-existing tsc break from
                // the @types/node bump — unrelated to the ESM transport gate.)
                fetch: ((input: RequestInfo | URL, init?: RequestInit) =>
                    realWindow.fetch(input, { ...init, signal: controller.signal })) as typeof fetch,
            },
        )

        setLoadedApp(loaded_app)
        return loaded_app
    }

    registerLoader(app.name, {
        id: props.component_path,
        init,
        controller,
    })

    if (!areLoadersInProcess[app.name]) {
        resolveLoaders(app.name)
    }
}

initLoadMicroApp = realWindow.__INIT_LOAD_MICROAPP__ || initLoadMicroAppFn

if (!realWindow.__INIT_LOAD_MICROAPP__) {
    realWindow.__INIT_LOAD_MICROAPP__ = initLoadMicroApp
}

export { initLoadMicroApp }
