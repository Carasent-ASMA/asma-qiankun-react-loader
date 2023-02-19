import { useEffect, useRef /* , useState */ } from 'react'
import type { MicroApp, ObjectType } from 'asma-qiankun'

import { IMfComponentLoader, IMfComponentLoaderInternal, initLoadMicroApp } from './LoaderQueue'

function MfComponentLoaderInternal<T extends ObjectType>({
    app,
    props,
    className,
    placeholder = 'mf original',
}: IMfComponentLoaderInternal<T>) {
    const effectCalled = useRef<boolean>(false)

    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (effectCalled.current) {
            return
        }

        effectCalled.current = true
        const abortController = new AbortController()

        if (!app) {
            console.error('No micro app was provied! microapp components wont render!`')
            return
        }

        let loadedapp: MicroApp | undefined

        initLoadMicroApp(
            app,
            props,
            containerRef,
            (lApp) => {
                loadedapp = lApp
            },
            abortController,
        )

        return () => {
            abortController.abort()

            if (!loadedapp) {
                console.warn('loadedapp is undefined!')
                return
            }
            loadedapp.unmount()
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
