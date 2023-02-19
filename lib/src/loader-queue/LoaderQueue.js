import { loadASMAMicroAPP } from '../loadASMAMicroApp';
const LoaderQueue = {};
const occurences = {};
function incrementOccurence(app_name) {
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
const areLoadersInProcess = {};
async function resolveLoaders(app_name) {
    areLoadersInProcess[app_name] = true;
    while (areLoadersInProcess[app_name]) {
        const loader_to_resolve = LoaderQueue[app_name]?.[0];
        if (loader_to_resolve) {
            await loader_to_resolve.init()?.bootstrapPromise;
            const idx = LoaderQueue[app_name]?.findIndex((l) => l.id === loader_to_resolve.id);
            if (idx && idx >= 0) {
                LoaderQueue[app_name]?.splice(idx, 1);
            }
        }
        if (!LoaderQueue[app_name]?.length) {
            areLoadersInProcess[app_name] = false;
        }
    }
}
let initLoadMicroApp;
function initLoadMicroAppFn(app, props, containerRef, setLoadedApp, abortController) {
    function init() {
        let loadedapp = null;
        if (containerRef.current) {
            loadedapp = loadASMAMicroAPP({
                name: app.name,
                entry: app.entry,
                container: containerRef.current,
                props: { ...props, occurence: occurences[app.name] },
            }, {
                fetch: (input, init) => window.fetch(input, { ...init, signal: abortController.signal }),
            });
        }
        if (loadedapp) {
            setLoadedApp(loadedapp);
        }
        return loadedapp;
    }
    incrementOccurence(app.name);
    registerLoader(app.name, { id: props.component_path, init });
    if (!areLoadersInProcess[app.name]) {
        resolveLoaders(app.name);
    }
}
initLoadMicroApp = window.__INIT_LOAD_MICROAPP__ || initLoadMicroAppFn;
if (!window.__INIT_LOAD_MICROAPP__) {
    window.__INIT_LOAD_MICROAPP__ = initLoadMicroApp;
}
export { initLoadMicroApp };
//# sourceMappingURL=LoaderQueue.js.map