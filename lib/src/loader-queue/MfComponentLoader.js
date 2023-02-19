import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef /* , useState */ } from 'react';
import { initLoadMicroApp } from './LoaderQueue';
function MfComponentLoaderInternal({ app, props, className, placeholder = 'mf original', }) {
    const effectCalled = useRef(false);
    const containerRef = useRef(null);
    useEffect(() => {
        if (effectCalled.current) {
            return;
        }
        effectCalled.current = true;
        const abortController = new AbortController();
        if (!app) {
            console.error('No micro app was provied! microapp components wont render!`');
            return;
        }
        let loadedapp;
        initLoadMicroApp(app, props, containerRef, (lApp) => {
            loadedapp = lApp;
        }, abortController);
        return () => {
            abortController.abort();
            if (!loadedapp) {
                console.warn('loadedapp is undefined!');
                return;
            }
            loadedapp.unmount();
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