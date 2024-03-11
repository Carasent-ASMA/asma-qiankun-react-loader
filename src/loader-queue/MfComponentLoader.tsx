import { useEffect, useRef, useState } from 'react'

import type { MicroApp, ObjectType } from 'asma-qiankun'

import {
    type IMfComponentLoader,
    incrementOccurrence,
    initLoadMicroApp,
    LoaderQueue,
    removeLoaderToResolve,
} from './LoaderQueue'

function MfComponentLoaderInternal<T extends ObjectType>({
    app,
    props,
    className,
    placeholder = 'mf original',
    LoaderComponent,
    abortSignal,
}: IMfComponentLoader<T>) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!app) {
            console.error('No micro app was provied! microapp components wont render!`')
            return
        }

        const abortController = abortSignal ? new AbortController() : undefined
        if (props.component_path === '/my-recipients-widget') {
            console.log('MfComponentLoaderInternal mounted: ', app.name)
        }
        incrementOccurrence(app.name)

        let loadedapp: MicroApp | undefined //= loadASMAMicroAPP(app, props, containerRef)
        setLoading(true)
        initLoadMicroApp({
            app,
            props,
            containerRef,
            setLoadedApp: (lApp) => {
                loadedapp = lApp
                setLoading(false)
            },
            abortSignal: abortSignal || abortController?.signal,
        })

        return () => {
            const loader = LoaderQueue[app.name]?.find((l) => l.id === props.component_path)
            if (props.component_path === '/my-recipients-widget') {
                console.log('MfComponentLoaderInternal mounted: ', app.name)
            }

            abortController?.abort()

            loadedapp =
                loadedapp ||
                loader?.micro_app ||
                LoaderQueue[app.name]?.find((l) => l.id === props.component_path)?.init()

            loadedapp?.unmount()

            removeLoaderToResolve(app.name, props.component_path)
        }
    }, [])

    // if (pending) {
    // return <div>pending... {placeholder}</div>
    // }
    return (
        <div ref={containerRef} className={className}>
            {(loading && ((LoaderComponent && <LoaderComponent />) || null)) || placeholder}
        </div>
    )
}
export function MfComponentLoader<T extends ObjectType>(props: IMfComponentLoader<T>) {
    useEffect(() => {
        if (props.props.component_path === '/my-recipients-widget') {
            console.log('MfComponentLoader mounted: ', props.app?.name)
        }
        return () => {
            if (props.props.component_path === '/my-recipients-widget') {
                console.log('MfComponentLoader unmounted: ', props.app?.name)
            }
        }
    }, [])
    if (!props.app) {
        console.error(
            `No micro app with path '${props.props.component_path}' was provied! microapp components wont render!`,
        )

        return <div>No micro app `adopus-app-directory` was provied!</div>
    }

    return <MfComponentLoaderInternal app={props.app} {...props} />
}

export default MfComponentLoader
