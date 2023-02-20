import { useEffect, useRef } from 'react'

import type { MicroApp, ObjectType } from 'asma-qiankun'

import {
    IMfComponentLoader,
    IMfComponentLoaderInternal,
    incrementOccurence,
    initLoadMicroApp,
    LoaderQueue,
    removeLoaderToResolve,
} from './LoaderQueue'

function MfComponentLoaderInternal<T extends ObjectType>({
    app,
    props,
    className,
    placeholder = 'mf original',
}: IMfComponentLoaderInternal<T>) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        incrementOccurence(app.name)
        if (!app) {
            console.error('No micro app was provied! microapp components wont render!`')
            return
        }

        let loadedapp: MicroApp | undefined //= loadASMAMicroAPP(app, props, containerRef)

        initLoadMicroApp(app, props, containerRef, (lApp) => {
            loadedapp = lApp
        })
        //console.log(`${app.name} mounting... ${props.component_path} micro_app:`, loadedapp!)

        return () => {
            const loader = LoaderQueue[app.name]?.find((l) => l.id === props.component_path)

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
            {placeholder}
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
