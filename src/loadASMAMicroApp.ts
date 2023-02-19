//import { loadMicroApp } from './qiankun/src'

import { setAsmaRegistrableAppsNew } from './registerASMAMicroApps'

let loadASMAMicroAPP = window.__ASMA__QIANKUN__SHELL__?.loadMicroApp!

if (!loadASMAMicroAPP) {
    setLoadMicroApp()
}
export async function setLoadMicroApp() {
    if (!loadASMAMicroAPP) {
        const asma_qiankun = await import('asma-qiankun')

        loadASMAMicroAPP = asma_qiankun.loadMicroApp

        window.__ASMA__QIANKUN__SHELL__ = window.__ASMA__QIANKUN__SHELL__ || {}

        window.__ASMA__QIANKUN__SHELL__.loadMicroApp = loadASMAMicroAPP

        setAsmaRegistrableAppsNew([
            'adopus-app-directory',
            'asma-app-notification',
            'asma-app-artifact',
            'asma-app-calendar',
            'asma-app-chat',
            'asma-app-consents',
            'asma-app-directory',
            'asma-app-office',
        ])

        asma_qiankun.start()
    }
}
export { loadASMAMicroAPP }
