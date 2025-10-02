import { useEffect, useRef, useState } from 'react'

import type { MicroApp, ObjectType } from 'asma-qiankun'

import { incrementOccurrence, initLoadMicroApp, removeLoaderToResolve, type IMfComponentLoader } from './LoaderQueue'

function MfComponentLoaderInternal<T extends ObjectType>({
    app,
    props,
    className,
    placeholder = 'mf original',
    LoaderComponent,
    passUpdateFunctionToParent,
    controller: _controller,
}: IMfComponentLoader<T>) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState(false)
    const [loadedApp, setLoadedApp] = useState<MicroApp | undefined>()
    const occurrenceRef = useRef<number | undefined>(0)

    useEffect(() => {
        if (!loadedApp || loading) return

        if (loadedApp?.update) {
            loadedApp?.update({
                ...props,
                occurence: occurrenceRef.current,
                occurrence: occurrenceRef.current,
                container: containerRef.current!,
            })
        }
    }, [props, loadedApp, loading])

    useEffect(() => {
        const update = loadedApp?.update

        if (!update || !passUpdateFunctionToParent || loading) return

        const updateFn = (local_props: T) => {
            const occurrence = occurrenceRef.current

            update({ ...local_props, occurence: occurrence, occurrence })
        }

        passUpdateFunctionToParent(updateFn)
    }, [passUpdateFunctionToParent, loadedApp, loading])

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
