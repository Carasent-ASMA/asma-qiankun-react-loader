import { getKeys } from '../helpers'

const __MICROAPP_REGISTRY = {
    'asma-app-calendar': {
        name: '',
        entry: ``,
        container: '#micro-app',
        loader: () => {},
        //activeRule: ['/calendar', '/tasks'],
        activeRule: 'component-only',
    },
    'asma-app-chat': {
        name: '',
        entry: ``,
        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
    'asma-app-office': {
        name: '',
        entry: ``,
        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
    'asma-app-directory': {
        name: '',
        entry: ``,

        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
    'adopus-app-directory': {
        name: '',
        entry: '',
        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
    'asma-app-artifact': {
        name: '',
        entry: '',
        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
    'asma-app-notification': {
        name: '',
        entry: '',
        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
    'asma-app-consents': {
        name: '',
        entry: '',
        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
    'asma-app-devextreme': {
        name: '',
        entry: '',
        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
    'asma-app-activities': {
        name: '',
        entry: '',
        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
    'asma-app-crm': {
        name: '',
        entry: '',
        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
    'asma-app-layouts': {
        name: '',
        entry: '',
        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
    'asma-app-storage': {
        name: '',
        entry: '',
        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
    'asma-app-editor': {
        name: '',
        entry: '',
        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
    // @deprecated — retained as alias during the asma-app-qnreditor → asma-app-editor rename window (ASMA-7576 Phase R).
    // Remove once all consumer apps are redeployed on the new key (TASK-R08).
    'asma-app-qnreditor': {
        name: '',
        entry: '',
        container: '#micro-app',
        loader: () => {},
        activeRule: 'component-only',
    },
}

export type IMicroAppRegistryNames = keyof typeof __MICROAPP_REGISTRY

getKeys(__MICROAPP_REGISTRY).forEach((app_name) => {
    __MICROAPP_REGISTRY[app_name].name = app_name
})

export { __MICROAPP_REGISTRY }
