import type { RefObject } from 'react';
import type { Entry, MicroApp } from 'asma-qiankun';
export interface IMfComponentLoader<T> extends Pick<React.HTMLAttributes<HTMLDivElement>, 'className'> {
    app?: {
        name: string;
        entry: Entry;
    };
    props: IMicroAppProps<T>;
    placeholder?: string;
}
export interface IMfComponentLoaderInternal<T> extends Pick<React.HTMLAttributes<HTMLDivElement>, 'className'> {
    app: {
        name: string;
        entry: Entry;
    };
    props: IMicroAppProps<T>;
    placeholder?: string;
}
export type IMicroAppProps<T> = {
    component_path: string;
} & T;
declare let initLoadMicroApp: typeof initLoadMicroAppFn;
declare function initLoadMicroAppFn(app: {
    name: string;
    entry: Entry;
}, props: IMicroAppProps<{}>, containerRef: RefObject<HTMLDivElement>, setLoadedApp: (lApp: MicroApp) => void, abortController: AbortController): void;
declare global {
    interface Window {
        __INIT_LOAD_MICROAPP__?: typeof initLoadMicroAppFn;
    }
}
export { initLoadMicroApp };
//# sourceMappingURL=LoaderQueue.d.ts.map