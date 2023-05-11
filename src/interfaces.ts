import type { RegistrableApp } from 'asma-qiankun/src'
import type { IMicroAppRegistryNames } from './registry/microapp-registry'

export interface IASMAAppsObject extends Record<IMicroAppRegistryNames, RegistrableApp<{}>> {}
