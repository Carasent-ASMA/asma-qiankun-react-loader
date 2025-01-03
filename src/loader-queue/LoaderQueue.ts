import type { Entry, MicroApp } from 'asma-qiankun'
import remove from 'lodash-es/remove'
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
    micro_app_loader.micro_app = micro_app_loader.init()

    micro_app_loader.controller.signal.onabort = async () => {
        await micro_app_loader.micro_app?.unmount()

        removeLoaderToResolve(app_name, micro_app_loader.id)
    }

    await micro_app_loader.micro_app?.bootstrapPromise
        .catch(() => {
            removeLoaderToResolve(app_name, micro_app_loader.id)
        })
        .finally(() => {
            removeLoaderToResolve(app_name, micro_app_loader.id)
        })
}

export const LoaderQueue: IAppLoaderQueue = {}

export const occurrences: Record<string, number> = {}

export function incrementOccurrence(app_name: string) {
    if (!occurrences[app_name]) {
        occurrences[app_name] = 0
    }
    occurrences[app_name]++
}

function registerLoader(app_name: string, loader: ILoader) {
    if (!LoaderQueue[app_name]) {
        LoaderQueue[app_name] = []
    }

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
    passUpdateFunctionToParent?: (updatePropsFn: (props: T) => void) => void
    placeholder?: string
    LoaderComponent?: () => JSX.Element
    controller?: AbortController
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
    setLoadedApp: (lApp: MicroApp, occurrence?: number) => void
    controller: AbortController
}) {
    function init() {
        if (controller.signal.aborted) {
            console.warn('init signal aborted: ', controller.signal.aborted, 'reason: ', controller.signal.reason)

            removeLoaderToResolve(app.name, props.component_path)
            return
        }
        const occurrence = occurrences[app.name]
        const loaded_app = loadASMAMicroAPP(
            {
                name: app.name,
                entry: app.entry,
                container: containerRef.current!,

                props: {
                    ...props,
                    /**
                     * @deprecated remove in next major version
                     */
                    occurence: occurrence,
                    occurrence,
                },
            },
            {
                fetch: (input: RequestInfo | URL, init?: RequestInit) => realWindow.fetch(input, { ...init }),
            },
        )

        setLoadedApp(loaded_app, occurrence)

        return loaded_app
    }

    incrementOccurrence(app.name)

    registerLoader(app.name, { id: props.component_path, init, controller })

    if (!areLoadersInProcess[app.name]) {
        resolveLoaders(app.name)
    }
}

initLoadMicroApp = realWindow.__INIT_LOAD_MICROAPP__ || initLoadMicroAppFn

if (!realWindow.__INIT_LOAD_MICROAPP__) {
    realWindow.__INIT_LOAD_MICROAPP__ = initLoadMicroApp
}

export { initLoadMicroApp }
