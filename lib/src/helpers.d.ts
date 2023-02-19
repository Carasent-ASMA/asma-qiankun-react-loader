export declare const getKeys: <T extends object>(obj: T) => (keyof T)[];
declare global {
    interface Window {
        $RefreshReg$: () => void;
        $RefreshSig$: () => <T>(type: T) => T;
        __vite_plugin_react_preamble_installed__: boolean;
    }
}
export declare function setReactRefreshOnWindow(dev?: boolean): void;
//# sourceMappingURL=helpers.d.ts.map