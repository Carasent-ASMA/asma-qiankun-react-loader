//import { loadMicroApp } from './qiankun/src'
import { registry_envs } from './registry/environment-entries'

import { realWindow, setAsmaRegistrableAppsNew } from './registerASMAMicroApps'

let loadASMAMicroAPP = realWindow.__ASMA__QIANKUN__SHELL__?.loadMicroApp!

/* if (!loadASMAMicroAPP) {
    setLoadMicroApp()
} */

export async function setLoadMicroApp(
    // importerFn: () => Promise<typeof import('asma-qiankun')>,
    dev_mode: boolean,
    registry_urls?: (typeof registry_envs)['local'],
) {
    if (!loadASMAMicroAPP) {
        await setLoadMicroAppLoc(/* importerFn(),  */ dev_mode, registry_urls)
    }
}
async function setLoadMicroAppLoc(
    // asma_qiankun_promise: Promise<typeof import('asma-qiankun')>,
    dev_mode: boolean,
    registry_urls?: (typeof registry_envs)['local'],
) {
    if (!loadASMAMicroAPP) {
        const asma_qiankun = await import('asma-qiankun')
        const singleSpa = await import('single-spa')

        loadASMAMicroAPP = asma_qiankun.loadMicroApp

        realWindow.__ASMA__QIANKUN__SHELL__ = realWindow.__ASMA__QIANKUN__SHELL__ || {}

        realWindow.__ASMA__QIANKUN__SHELL__.loadMicroApp = loadASMAMicroAPP

        await setAsmaRegistrableAppsNew({
            reg_app_names: [
                'adopus-app-directory',
                'asma-app-notification',
                'asma-app-artifact',
                'asma-app-calendar',
                'asma-app-chat',
                'asma-app-consents',
                'asma-app-directory',
                'asma-app-office',
                'asma-app-devextreme',
                'asma-app-activities',
                'asma-app-layouts',
                'asma-app-storage',
            ],
            devtools: dev_mode,
            registry_urls,
        })
        singleSpa.setBootstrapMaxTime(8000, false, 15000)
        singleSpa.setMountMaxTime(5000, false, 15000)
        singleSpa.setUnmountMaxTime(5000, true, 15000)

        asma_qiankun.start({ sandbox: { strictStyleIsolation: true, experimentalStyleIsolation: true } })
    }
}
export { loadASMAMicroAPP }
