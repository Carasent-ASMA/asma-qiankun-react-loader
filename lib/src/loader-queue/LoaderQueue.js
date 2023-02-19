import { loadASMAMicroAPP } from 'asma-qiankun/src/loadASMAMicroApp';
import { remove } from 'lodash';
export function removeLoaderToResolve(app_name, loader_to_resolve_id) {
    /*   const micro_app_loader = LoaderQueue[app_name]?.find((l) => l.id === loader_to_resolve_id)

    if (micro_app_loader && !micro_app_loader?.micro_app) {
        micro_app_loader.init().unmount()
    } */
    remove(LoaderQueue[app_name] || [], (l) => l.id === loader_to_resolve_id);
    if (!LoaderQueue[app_name]?.length) {
        areLoadersInProcess[app_name] = false;
    }
}
async function resolveMicroAppLoader(app_name, micro_app_loader) {
    micro_app_loader.micro_app = micro_app_loader.init();
    if (app_name === 'asma-app-calendar') {
        console.log(`${micro_app_loader.id} `, micro_app_loader);
    }
    await micro_app_loader.micro_app?.bootstrapPromise
        .catch(() => {
        removeLoaderToResolve(app_name, micro_app_loader.id);
    })
        .finally(() => {
        removeLoaderToResolve(app_name, micro_app_loader.id);
    });
}
export const LoaderQueue = {};
export const occurences = {};
export function incrementOccurence(app_name) {
    if (!occurences[app_name]) {
        occurences[app_name] = 0;
    }
    occurences[app_name]++;
}
function registerLoader(app_name, loader) {
    if (!LoaderQueue[app_name]) {
        LoaderQueue[app_name] = [];
    }
    LoaderQueue[app_name].push(loader);
}
export const areLoadersInProcess = {};
async function resolveLoaders(app_name) {
    areLoadersInProcess[app_name] = true;
    while (areLoadersInProcess[app_name]) {
        const loader_to_resolve = LoaderQueue[app_name]?.[0];
        if (loader_to_resolve) {
            await resolveMicroAppLoader(app_name, loader_to_resolve);
            /*  loader_to_resolve.micro_app = loader_to_resolve.init() || undefined

            await loader_to_resolve.micro_app?.bootstrapPromise
                .catch(() => {
                    removeLoaderToResolve(app_name, loader_to_resolve.id)
                })
                .finally(() => {
                    removeLoaderToResolve(app_name, loader_to_resolve.id)
                }) */
        }
        /*  if (!LoaderQueue[app_name]?.length) {
            areLoadersInProcess[app_name] = false
        } */
    }
}
const initLoadMicroApp = initLoadMicroAppFn;
function initLoadMicroAppFn(app, props, containerRef, setLoadedApp) {
    function init() {
        const loadedapp = loadASMAMicroAPP({
            name: app.name,
            entry: app.entry,
            container: containerRef.current,
            props: { ...props, occurence: occurences[app.name] },
        }, {});
        setLoadedApp(loadedapp);
        return loadedapp;
    }
    incrementOccurence(app.name);
    registerLoader(app.name, { id: props.component_path, init });
    if (!areLoadersInProcess[app.name]) {
        resolveLoaders(app.name);
    }
}
/* declare global {
    interface Window {
        __INIT_LOAD_MICROAPP__?: typeof initLoadMicroAppFn
    }
} */
//initLoadMicroApp = /* window.__INIT_LOAD_MICROAPP__ || */ initLoadMicroAppFn
if (!window.__INIT_LOAD_MICROAPP__) {
    window.__INIT_LOAD_MICROAPP__ = initLoadMicroApp;
}
export { initLoadMicroApp };
//# sourceMappingURL=LoaderQueue.js.map