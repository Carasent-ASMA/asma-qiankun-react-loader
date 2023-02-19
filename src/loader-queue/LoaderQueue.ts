import type { RefObject } from 'react'
import { loadASMAMicroAPP } from '../loadASMAMicroApp'
import type { Entry, MicroApp } from 'asma-qiankun'

const LoaderQueue: IAppLoaderQueue = {}

const occurences: Record<string, number> = {}

function incrementOccurence(app_name: string) {
    if (!occurences[app_name]) {
        occurences[app_name] = 0
    }
    occurences[app_name]++
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
    init: () => MicroApp | null
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

const areLoadersInProcess = {} as Record<string, boolean>

async function resolveLoaders(app_name: string) {
    areLoadersInProcess[app_name] = true

    while (areLoadersInProcess[app_name]) {
        const loader_to_resolve = LoaderQueue[app_name]?.[0]

        if (loader_to_resolve) {
            await loader_to_resolve.init()?.bootstrapPromise

            const idx = LoaderQueue[app_name]?.findIndex((l) => l.id === loader_to_resolve.id)

            if (idx && idx >= 0) {
                LoaderQueue[app_name]?.splice(idx, 1)
            }
        }

        if (!LoaderQueue[app_name]?.length) {
            areLoadersInProcess[app_name] = false
        }
    }
}

let initLoadMicroApp: typeof initLoadMicroAppFn

function initLoadMicroAppFn(
    app: { name: string; entry: Entry },
    props: IMicroAppProps<{}>,
    containerRef: RefObject<HTMLDivElement>,
    setLoadedApp: (lApp: MicroApp) => void,
    abortController: AbortController,
) {
    function init() {
        let loadedapp: MicroApp | null = null

        if (containerRef.current) {
            loadedapp = loadASMAMicroAPP(
                {
                    name: app.name,
                    entry: app.entry,
                    container: containerRef.current,
                    props: { ...props, occurence: occurences[app.name] },
                },
                {
                    fetch: (input: RequestInfo | URL, init?: RequestInit | undefined) =>
                        window.fetch(input, { ...init, signal: abortController.signal }),
                },
            )
        }
        if (loadedapp) {
            setLoadedApp(loadedapp)
        }

        return loadedapp
    }

    incrementOccurence(app.name)

    registerLoader(app.name, { id: props.component_path, init })

    if (!areLoadersInProcess[app.name]) {
        resolveLoaders(app.name)
    }
}
declare global {
    interface Window {
        __INIT_LOAD_MICROAPP__?: typeof initLoadMicroAppFn
    }
}

initLoadMicroApp = window.__INIT_LOAD_MICROAPP__ || initLoadMicroAppFn
if (!window.__INIT_LOAD_MICROAPP__) {
    window.__INIT_LOAD_MICROAPP__ = initLoadMicroApp
}

export { initLoadMicroApp }
