import { setReactRefreshOnWindow } from './helpers'
import type { IASMAAppsObject as IAsmaAppsObject } from './interfaces'
import type { RegistrableApp } from 'asma-qiankun'

import { registry_envs } from './registry/environment-entries'
import { type IMicroAppRegistryNames, __MICROAPP_REGISTRY } from './registry/microapp-registry'
declare global {
    interface Window {
        rawWindow?: typeof window
        /**
         *@readonly do not update directly use setAppsObject() in stead
         */
        __ASMA_REGISTRABLE_APPS__?: IAsmaAppsObject
    }
}
export const realWindow = window.rawWindow || window
let asmaRegistrableApps: IAsmaAppsObject | undefined
export function getAsmaRegistrableApps() {
    if (realWindow.__ASMA_REGISTRABLE_APPS__) {
        return realWindow.__ASMA_REGISTRABLE_APPS__
    }
    return asmaRegistrableApps
}

const islocal = realWindow.location.origin.includes('local') || realWindow.location.origin.includes('127.0.0.1')

export function setAsmaRegistrableAppsNew({
    devtools = false,
    reg_app_names,
    registry_urls: _registry_urls,
}: {
    reg_app_names: IMicroAppRegistryNames[]
    registry_urls?: (typeof registry_envs)['local']

    devtools: boolean
}) {
    const env = islocal ? 'local' : 'cloud'

    const micro_app_registry = __MICROAPP_REGISTRY

    const registry_urls = _registry_urls || registry_envs[env]

    const registry_envs_names = _registry_urls && (Object.keys(_registry_urls) as IMicroAppRegistryNames[])

    const picked_microapps = (registry_envs_names || reg_app_names).reduce(
        (acc, name) => {
            acc[name] = micro_app_registry[name] ||
                console.warn(`No registry entry for ${name}, creating new one!`) || {
                    name,
                    entry: '',
                    container: '#micro-app',
                    loader: () => {},
                    activeRule: 'component-only',
                }

            acc[name].entry = registry_urls[name]

            return acc
        },
        {} as typeof __MICROAPP_REGISTRY,
    )

    setReactRefreshOnWindow(devtools)

    return _setAsmaRegistrableApps(picked_microapps, devtools)
}

/**
 * In dev mode it  set ImportMapOverrides app
 *
 * call this function before render App() method.
 * @param registrable_apps IAsmaAppsObject
 * @param devtools bool
 */
async function _setAsmaRegistrableApps(registrable_apps?: IAsmaAppsObject, devtools?: boolean) {
    if (!registrable_apps) {
        devtools && console.warn('No registrable apps detected!')

        return
    }
    if (realWindow.__ASMA_REGISTRABLE_APPS__) {
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
            | undefined = realWindow.importMapOverrides

        imo?.setDefaultMap(Object.values(registrable_apps))

        asmaRegistrableApps = imo?.getCurrentQiankunMap()
    } else {
        localStorage.removeItem('asma-devtools')

        asmaRegistrableApps = registrable_apps
    }

    if (!realWindow.__ASMA__QIANKUN__SHELL__) {
        realWindow.__ASMA__QIANKUN__SHELL__ = {}
    }

    realWindow.__ASMA_REGISTRABLE_APPS__ = asmaRegistrableApps
}

export function isEmpty(obj: unknown) {
    if (typeof obj === 'object') {
        return (obj && Object.keys(obj).length === 0) || true
    }
    if (Array.isArray(obj)) {
        return obj.length === 0
    }

    return !!obj
}
