import type { IASMAAppsObject as IAsmaAppsObject } from './interfaces';
import { type IMicroAppRegistryNames } from './registry/microapp-registry';
/**
 *@readonly do not update directly use setAppsObject() in stead
 */
declare global {
    interface Window {
        __ASMA_REGISTRABLE_APPS__?: IAsmaAppsObject;
    }
}
export declare function getAsmaRegistrableApps(): IAsmaAppsObject | undefined;
export declare function setAsmaRegistrableAppsNew(reg_app_names: IMicroAppRegistryNames[], devtools?: boolean): Promise<void>;
/**
 * before registerAsmaMicroApps one need to call setAsmaRegistrableApps to ensure microapp registration!
 * call this method after render App() method.
 */
export declare function isEmpty(obj: unknown): boolean;
//# sourceMappingURL=registerASMAMicroApps.d.ts.map