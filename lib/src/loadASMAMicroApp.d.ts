import type { envs } from './registry/environment-entries';
declare let loadASMAMicroAPP: typeof import("asma-qiankun").loadMicroApp;
export declare function setLoadMicroApp(importerFn: () => Promise<typeof import('asma-qiankun')>, env: envs, dev_mode: boolean): Promise<void>;
export { loadASMAMicroAPP };
//# sourceMappingURL=loadASMAMicroApp.d.ts.map