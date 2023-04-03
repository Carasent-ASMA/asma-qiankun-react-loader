import { setReactRefreshOnWindow } from './helpers'
import type { IASMAAppsObject as IAsmaAppsObject } from './interfaces'
import type { RegistrableApp } from 'asma-qiankun'

import { registry_envs } from './registry/environment-entries'
import { IMicroAppRegistryNames, __MICROAPP_REGISTRY } from './registry/microapp-registry'
/**
 *@readonly do not update directly use setAppsObject() in stead
 */
declare global {
    interface Window {
        __ASMA_REGISTRABLE_APPS__?: IAsmaAppsObject
    }
}
let asmaRegistrableApps: IAsmaAppsObject | undefined
export function getAsmaRegistrableApps() {
    if (window.__ASMA_REGISTRABLE_APPS__) {
        return window.__ASMA_REGISTRABLE_APPS__
    }
    return asmaRegistrableApps
}

const islocal = window.location.origin.includes('local') || window.location.origin.includes('127.0.0.1')

export function setAsmaRegistrableAppsNew(
    reg_app_names: IMicroAppRegistryNames[],

    devtools = false,
) {
    const env = islocal ? 'local' : 'cloud'

    const picked_microapps = reg_app_names.reduce((acc, name) => {
        acc[name] = __MICROAPP_REGISTRY[name]

        acc[name].entry = registry_envs[env][name]

        return acc
    }, {} as typeof __MICROAPP_REGISTRY)

    setReactRefreshOnWindow(devtools)

    return setAsmaRegistrableApps(picked_microapps, devtools)
}

/**
 * In dev mode it  set ImportMapOverrides app
 *
 * call this function before render App() method
 * @deprecated use setAsmaRegistrableAppsNew()
 * @param registrable_apps IAsmaAppsObject
 * @param devtools bool
 */
async function setAsmaRegistrableApps(registrable_apps?: IAsmaAppsObject, devtools?: boolean) {
    if (!registrable_apps) {
        devtools && console.warn('No registrable apps detected!')

        return
    }
    if (window.__ASMA_REGISTRABLE_APPS__) {
        return
    }

    if (devtools || localStorage.getItem('asma-debug') === 'true') {
        const element = document.createElement('import-map-overrides-full')

        element.setAttribute('show-when-local-storage', 'asma-devtools')

        localStorage.setItem('asma-devtools', 'true')

        document.body.appendChild(element)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        await import('qiankun-overrides')

        const imo:
            | {
                  setDefaultMap: (apps: RegistrableApp<{}>[]) => void
                  getCurrentQiankunMap: () => IAsmaAppsObject | undefined
              }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            | undefined = window.importMapOverrides

        imo?.setDefaultMap(Object.values(registrable_apps))

        asmaRegistrableApps = imo?.getCurrentQiankunMap()
    } else {
        localStorage.removeItem('asma-devtools')

        asmaRegistrableApps = registrable_apps
    }

    if (!window.__ASMA__QIANKUN__SHELL__) {
        window.__ASMA__QIANKUN__SHELL__ = {}
    }

    window.__ASMA_REGISTRABLE_APPS__ = asmaRegistrableApps
}

/**
 * before registerAsmaMicroApps one need to call setAsmaRegistrableApps to ensure microapp registration!
 * call this method after render App() method.
 */
/* export async function registerAsmaMicroApps() {
    if (asmaRegistrableApps && !isEmpty(asmaRegistrableApps)) {
        registerMicroApps(
            Object.values<RegistrableApp<{}>>(asmaRegistrableApps).filter((app) => app.activeRule !== 'component-only'),
            {
                beforeLoad: async (app) => {
                    console.log('[LifeCycle] before load', 'color: green;', app.name)
                },

                beforeMount: async (app) => {
                    console.log('[LifeCycle] before mount', 'color: green;', app.name)
                },

                afterUnmount: async (app) => {
                    console.log('[LifeCycle] after unmount', 'color: green;', app.name)
                },
            },
        )
    }
} */

export function isEmpty(obj: unknown) {
    if (typeof obj === 'object') {
        return (obj && Object.keys(obj).length === 0) || true
    }
    if (Array.isArray(obj)) {
        return obj.length === 0
    }

    return !!obj
}
