import { useEffect, useRef, useState } from 'react'

import type { MicroApp, ObjectType } from 'asma-qiankun'

import {
    type IMfComponentLoader,
    incrementOccurrence,
    initLoadMicroApp,
    //LoaderQueue,
    removeLoaderToResolve,
} from './LoaderQueue'

function MfComponentLoaderInternal<T extends ObjectType>({
    app,
    props,
    className,
    placeholder = 'mf original',
    LoaderComponent,
    controller: _controller,
}: IMfComponentLoader<T>) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState(false)
    const [controller] = useState<AbortController>(_controller || new AbortController())

    useEffect(() => {
        if (!app) {
            console.error('No micro app was provided! microapp components wont render!`')
            return
        }

        if (controller.signal.aborted) {
            console.warn(
                `MfComponentLoaderInternal: controller signal is aborted, reason: ${controller.signal.reason}`,
                controller,
            )

            return
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
            controller: controller!,
        })

        return () => {
            //const loader = LoaderQueue[app.name]?.find((l) => l.id === props.component_path)

            if (!controller.signal.aborted) {
                controller.abort(
                    `unmounting MfComponentLoaderInternal for service: ${app.name} path: ${props.component_path}!`,
                )
            }

            /*    loadedapp =
                loadedapp ||
                loader?.micro_app ||
                LoaderQueue[app.name]?.find((l) => l.id === props.component_path)?.init() */

            loadedapp?.unmount()
            console.log('unmounting app: ', app.name, props.component_path, 'loadedapp: ', loadedapp)
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
    if (!props.app) {
        console.error(
            `No micro app with path '${props.props.component_path}' was provied! microapp components wont render!`,
        )

        return <div>No micro app `adopus-app-directory` was provied!</div>
    }

    return <MfComponentLoaderInternal app={props.app} {...props} />
}

export default MfComponentLoader
