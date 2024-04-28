import { realWindow } from "./registerASMAMicroApps"

export const getKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>

declare global {
    interface Window {
        $RefreshReg$: () => void
        $RefreshSig$: () => <T>(type: T) => T
        __vite_plugin_react_preamble_installed__: boolean
    }
}

export function setReactRefreshOnWindow(dev?: boolean) {
    if ((dev || localStorage.getItem('asma-debug') === 'true') && !realWindow.__vite_plugin_react_preamble_installed__) {
        realWindow.$RefreshReg$ = () => {}
        realWindow.$RefreshSig$ = () => (type) => type
        realWindow.__vite_plugin_react_preamble_installed__ = true
    }
}
