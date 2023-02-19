export function setGlobalConcurentQiankunProxy(global, appName) {
    if (!window.__GLOBAL_CONCURENT_QIANKUN__) {
        window.__GLOBAL_CONCURENT_QIANKUN__ = {};
    }
    window.__GLOBAL_CONCURENT_QIANKUN__[appName] = global;
    //@ts-ignore
    global.__GLOBAL_CONCURENT_QIANKUN__ = window.__GLOBAL_CONCURENT_QIANKUN__;
}
//# sourceMappingURL=setGlobalConcurentQiankunProxy.js.map