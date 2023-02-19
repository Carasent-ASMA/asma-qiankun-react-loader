import type { RegistrableApp } from 'asma-qiankun'
import type { IMicroAppRegistryNames } from './registry/microapp-registry'

export interface IASMAAppsObject extends Record<IMicroAppRegistryNames, RegistrableApp<{}>> {}
