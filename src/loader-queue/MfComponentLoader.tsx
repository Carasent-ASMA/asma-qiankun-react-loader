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
    passUpdateFunctionToParent,
    controller: _controller,
}: IMfComponentLoader<T>) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState(false)
    const loadedAppRef = useRef<MicroApp | undefined>(undefined)
    const occurrenceRef = useRef<number | undefined>(undefined)

    function update(props: T) {
        const occurrence = occurrenceRef.current
        const loadedApp = loadedAppRef.current
        console.log('update props called! Inside MfComponentLoader', { props, occurrence, loadedApp })
        if (loadedApp?.update) {
            loadedApp.update({ props, occurrence, occurence: occurrence })
        } else {
            console.warn('loadedApp is undefined or loadedApp.update is undefined, update props was not called!', {
                loadedApp,
            })
        }
    }
    useEffect(() => {
        if (passUpdateFunctionToParent) {
            passUpdateFunctionToParent(update) // Pass the internal function to the parent
        }
    }, [passUpdateFunctionToParent])
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

        const occurrence = incrementOccurrence(app.name)

        occurrenceRef.current = occurrence

        let loadedapp: MicroApp | undefined //= loadASMAMicroAPP(app, props, containerRef)

        setLoading(true)

        initLoadMicroApp({
            app,
            occurrence,
            props,
            containerRef,
            setLoadedApp: (lApp, occurrence) => {
                console.log('setLoadedApp called! Inside MfComponentLoader', { occurrence })
                loadedapp = lApp
                setLoading(false)
                loadedAppRef.current = lApp
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
