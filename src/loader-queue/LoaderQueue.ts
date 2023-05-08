import type { Entry, MicroApp } from 'asma-qiankun'
import { remove } from 'lodash'
import type { RefObject } from 'react'
import { loadASMAMicroAPP } from '../loadASMAMicroApp'

export function removeLoaderToResolve(app_name: string, loader_to_resolve_id: string) {
    /*   const micro_app_loader = LoaderQueue[app_name]?.find((l) => l.id === loader_to_resolve_id)

    if (micro_app_loader && !micro_app_loader?.micro_app) {
        micro_app_loader.init().unmount()
    } */

    remove(LoaderQueue[app_name] || [], (l) => l.id === loader_to_resolve_id)

    if (!LoaderQueue[app_name]?.length) {
        areLoadersInProcess[app_name] = false
    }
}

async function resolveMicroAppLoader(app_name: string, micro_app_loader: ILoader) {
    micro_app_loader.micro_app = micro_app_loader.init()

    if (app_name === 'asma-app-calendar') {
        console.log(`${micro_app_loader.id} `, micro_app_loader)
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
    init: () => MicroApp
    micro_app?: MicroApp
}

export interface IMfComponentLoader<T> extends Pick<React.HTMLAttributes<HTMLDivElement>, 'className'> {
    app?: { name: string; entry: Entry }
    props: IMicroAppProps<T>
    placeholder?: string
}

export interface IMfComponentLoaderInternal<T> extends Pick<React.HTMLAttributes<HTMLDivElement>, 'className'> {
    app: { name: string; entry: Entry }
    props: IMicroAppProps<T>
    placeholder?: string
}

export type IMicroAppProps<T> = { component_path: string } & T

export const areLoadersInProcess = {} as Record<string, boolean>

async function resolveLoaders(app_name: string) {
    areLoadersInProcess[app_name] = true

    while (areLoadersInProcess[app_name]) {
        const loader_to_resolve = LoaderQueue[app_name]?.[0]

        if (loader_to_resolve) {
            await resolveMicroAppLoader(app_name, loader_to_resolve)
            /*  loader_to_resolve.micro_app = loader_to_resolve.init() || undefined

            await loader_to_resolve.micro_app?.bootstrapPromise
                .catch(() => {
                    removeLoaderToResolve(app_name, loader_to_resolve.id)
                })
                .finally(() => {
                    removeLoaderToResolve(app_name, loader_to_resolve.id)
                }) */
        }

        /*  if (!LoaderQueue[app_name]?.length) {
            areLoadersInProcess[app_name] = false
        } */
    }
}

let initLoadMicroApp: typeof initLoadMicroAppFn

function initLoadMicroAppFn(
    app: { name: string; entry: Entry },
    props: IMicroAppProps<{}>,
    containerRef: RefObject<HTMLDivElement>,
    setLoadedApp: (lApp: MicroApp) => void,
) {
    function init() {
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
            {},
        )

        setLoadedApp(loaded_app)

        return loaded_app
    }

    incrementOccurrence(app.name)

    registerLoader(app.name, { id: props.component_path, init })

    if (!areLoadersInProcess[app.name]) {
        resolveLoaders(app.name)
    }
}
/* declare global {
    interface Window {
        __INIT_LOAD_MICROAPP__?: typeof initLoadMicroAppFn
    }
} */

initLoadMicroApp = window.__INIT_LOAD_MICROAPP__ || initLoadMicroAppFn

if (!window.__INIT_LOAD_MICROAPP__) {
    window.__INIT_LOAD_MICROAPP__ = initLoadMicroApp
}

export { initLoadMicroApp }
