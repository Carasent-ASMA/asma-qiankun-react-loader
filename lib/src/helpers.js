export const getKeys = Object.keys;
export function setReactRefreshOnWindow(dev) {
    if ((dev || localStorage.getItem('asma-debug') === 'true') && !window.__vite_plugin_react_preamble_installed__) {
        window.$RefreshReg$ = () => { };
        window.$RefreshSig$ = () => (type) => type;
        window.__vite_plugin_react_preamble_installed__ = true;
    }
}
//# sourceMappingURL=helpers.js.map