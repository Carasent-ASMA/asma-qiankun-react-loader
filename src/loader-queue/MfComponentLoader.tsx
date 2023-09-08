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
}: IMfComponentLoader<T>) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState(false)
    const [Mfapp, setApp] = useState<MicroApp | undefined>(undefined)

    useEffect(() => {
        if (!app) {
            console.error('No micro app was provied! microapp components wont render!`')
            return
        }

        incrementOccurrence(app.name)

        //let loadedapp: MicroApp | undefined //= loadASMAMicroAPP(app, props, containerRef)
        setLoading(true)
        initLoadMicroApp(app, props, containerRef, (lApp) => {
            setApp(lApp)
            setLoading(false)
        })
        //console.log(`${app.name} mounting... ${props.component_path} micro_app:`, loadedapp!)

        return () => {
            const loader = LoaderQueue[app.name]?.find((l) => l.id === props.component_path)

            const loadedapp =
                Mfapp || loader?.micro_app || LoaderQueue[app.name]?.find((l) => l.id === props.component_path)?.init()

            loadedapp?.unmount()

            removeLoaderToResolve(app.name, props.component_path)
        }
    }, [])
    useEffect(() => {
        if(!Mfapp?.update) {
            console.warn('Mfapp or MfApp.update is not defined')
            return
        }
        Mfapp.update(props)
    }, [props])

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
