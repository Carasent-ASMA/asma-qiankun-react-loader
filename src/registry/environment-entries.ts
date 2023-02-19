import type { RegistrableApp } from 'asma-qiankun'
import type { IMicroAppRegistryNames } from './microapp-registry'

export type envs = 'local' | 'cloud'

export interface IMicroAppRegistry extends Record<IMicroAppRegistryNames, RegistrableApp<{}>> {}

export const registry_envs: Record<envs, Record<IMicroAppRegistryNames, string>> = {
    cloud: {
        'adopus-app-directory': '/app-ao/directory/',
        'asma-app-notification': '/app/notification/',
        'asma-app-artifact': '/app/artifact/',
        'asma-app-calendar': '/app/calendar/',
        'asma-app-chat': '/app/chat/',
        'asma-app-consents': '/app/consents/',
        'asma-app-directory': '/app/directory/',
        'asma-app-office': '/app/office/',
    },
    local: {
        'adopus-app-directory': 'http://localhost:3100',
        'asma-app-notification': 'http://localhost:3007',
        'asma-app-artifact': 'http://localhost:3006',
        'asma-app-calendar': 'http://localhost:3001',
        'asma-app-chat': 'http://localhost:3002',
        'asma-app-consents': 'http://localhost:3008',
        'asma-app-directory': 'http://localhost:3003',
        'asma-app-office': 'http://localhost:3005',
    },
}
