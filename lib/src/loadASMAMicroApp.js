//import { loadMicroApp } from './qiankun/src'
import { setAsmaRegistrableAppsNew } from './registerASMAMicroApps';
let loadASMAMicroAPP = window.__ASMA__QIANKUN__SHELL__?.loadMicroApp;
/* if (!loadASMAMicroAPP) {
    setLoadMicroApp()
} */
export async function setLoadMicroApp(importerFn, env, dev_mode) {
    if (!loadASMAMicroAPP) {
        await setLoadMicroAppLoc(importerFn(), env, dev_mode);
    }
}
async function setLoadMicroAppLoc(asma_qiankun_promise, env, dev_mode) {
    if (!loadASMAMicroAPP) {
        const asma_qiankun = await asma_qiankun_promise;
        const singleSpa = await import('single-spa');
        loadASMAMicroAPP = asma_qiankun.loadMicroApp;
        window.__ASMA__QIANKUN__SHELL__ = window.__ASMA__QIANKUN__SHELL__ || {};
        window.__ASMA__QIANKUN__SHELL__.loadMicroApp = loadASMAMicroAPP;
        setAsmaRegistrableAppsNew([
            'adopus-app-directory',
            'asma-app-notification',
            'asma-app-artifact',
            'asma-app-calendar',
            'asma-app-chat',
            'asma-app-consents',
            'asma-app-directory',
            'asma-app-office',
        ], env, dev_mode);
        singleSpa.setBootstrapMaxTime(5000, false, 15000);
        singleSpa.setMountMaxTime(5000, false, 15000);
        singleSpa.setUnmountMaxTime(5000, true, 15000);
        asma_qiankun.start();
    }
}
export { loadASMAMicroAPP };
//# sourceMappingURL=loadASMAMicroApp.js.map