export const getKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>

declare global {
    interface Window {
        $RefreshReg$: () => void
        $RefreshSig$: () => <T>(type: T) => T
        __vite_plugin_react_preamble_installed__: boolean
    }
}

export function setReactRefreshOnWindow(dev?: boolean) {
    if ((dev || localStorage.getItem('asma-debug') === 'true') && !window.__vite_plugin_react_preamble_installed__) {
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
    }
}
