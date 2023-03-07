//import { loadMicroApp } from './qiankun/src'

import { setAsmaRegistrableAppsNew } from './registerASMAMicroApps'

let loadASMAMicroAPP = window.__ASMA__QIANKUN__SHELL__?.loadMicroApp!

/* if (!loadASMAMicroAPP) {
    setLoadMicroApp()
} */

export async function setLoadMicroApp(
    // importerFn: () => Promise<typeof import('asma-qiankun')>,
    dev_mode: boolean,
) {
    if (!loadASMAMicroAPP) {
        await setLoadMicroAppLoc(/* importerFn(),  */ dev_mode)
    }
}
async function setLoadMicroAppLoc(
    // asma_qiankun_promise: Promise<typeof import('asma-qiankun')>,
    dev_mode: boolean,
) {
    if (!loadASMAMicroAPP) {
        const asma_qiankun = await import('asma-qiankun')
        const singleSpa = await import('single-spa')

        loadASMAMicroAPP = asma_qiankun.loadMicroApp

        window.__ASMA__QIANKUN__SHELL__ = window.__ASMA__QIANKUN__SHELL__ || {}

        window.__ASMA__QIANKUN__SHELL__.loadMicroApp = loadASMAMicroAPP
       
        await setAsmaRegistrableAppsNew(
            [
                'adopus-app-directory',
                'asma-app-notification',
                'asma-app-artifact',
                'asma-app-calendar',
                'asma-app-chat',
                'asma-app-consents',
                'asma-app-directory',
                'asma-app-office',
            ],

            dev_mode,
        )
        singleSpa.setBootstrapMaxTime(8000, false, 15000)
        singleSpa.setMountMaxTime(5000, false, 15000)
        singleSpa.setUnmountMaxTime(5000, true, 15000)

        asma_qiankun.start()
    }
}
export { loadASMAMicroAPP }
