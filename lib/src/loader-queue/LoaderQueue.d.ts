import type { Entry, MicroApp } from 'asma-qiankun';
import type { RefObject } from 'react';
export declare function removeLoaderToResolve(app_name: string, loader_to_resolve_id: string): void;
export declare const LoaderQueue: IAppLoaderQueue;
export declare const occurrences: Record<string, number>;
export declare function incrementOccurrence(app_name: string): void;
interface IAppLoaderQueue {
    [app_names: string]: ILoader[];
}
interface ILoader {
    id: string;
    init: () => MicroApp;
    micro_app?: MicroApp;
}
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
export declare const areLoadersInProcess: Record<string, boolean>;
declare let initLoadMicroApp: typeof initLoadMicroAppFn;
declare function initLoadMicroAppFn(app: {
    name: string;
    entry: Entry;
}, props: IMicroAppProps<{}>, containerRef: RefObject<HTMLDivElement>, setLoadedApp: (lApp: MicroApp) => void): void;
export { initLoadMicroApp };
//# sourceMappingURL=LoaderQueue.d.ts.map