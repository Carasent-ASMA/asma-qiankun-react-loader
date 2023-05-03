import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { incrementOccurrence, initLoadMicroApp, LoaderQueue, removeLoaderToResolve, } from './LoaderQueue';
function MfComponentLoaderInternal({ app, props, className, placeholder = 'mf original', }) {
    const containerRef = useRef(null);
    useEffect(() => {
        incrementOccurrence(app.name);
        if (!app) {
            console.error('No micro app was provied! microapp components wont render!`');
            return;
        }
        let loadedapp; //= loadASMAMicroAPP(app, props, containerRef)
        initLoadMicroApp(app, props, containerRef, (lApp) => {
            loadedapp = lApp;
        });
        //console.log(`${app.name} mounting... ${props.component_path} micro_app:`, loadedapp!)
        return () => {
            const loader = LoaderQueue[app.name]?.find((l) => l.id === props.component_path);
            loadedapp =
                loadedapp ||
                    loader?.micro_app ||
                    LoaderQueue[app.name]?.find((l) => l.id === props.component_path)?.init();
            loadedapp?.unmount();
            removeLoaderToResolve(app.name, props.component_path);
        };
    }, []);
    // if (pending) {
    // return <div>pending... {placeholder}</div>
    // }
    return (_jsx("div", { ref: containerRef, className: className, children: placeholder }));
}
export function MfComponentLoader(props) {
    if (!props.app) {
        console.error(`No micro app with path '${props.props.component_path}' was provied! microapp components wont render!`);
        return _jsx("div", { children: "No micro app `adopus-app-directory` was provied!" });
    }
    return _jsx(MfComponentLoaderInternal, { app: props.app, ...props });
}
export default MfComponentLoader;
//# sourceMappingURL=MfComponentLoader.js.map