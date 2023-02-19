import type { RegistrableApp } from 'asma-qiankun';
import type { IMicroAppRegistryNames } from './microapp-registry';
export type envs = 'local' | 'cloud';
export interface IMicroAppRegistry extends Record<IMicroAppRegistryNames, RegistrableApp<{}>> {
}
export declare const registry_envs: Record<envs, Record<IMicroAppRegistryNames, string>>;
//# sourceMappingURL=environment-entries.d.ts.map