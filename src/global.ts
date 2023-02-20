import type { loadMicroApp } from 'asma-qiankun'
import type { initLoadMicroApp } from './loader-queue/LoaderQueue'

export interface QiankunWindow {
    //__POWERED_BY_QIANKUN__?: boolean
    [x: string]: any
}
declare global {
    interface Window {
        __POWERED_BY_QIANKUN__?: boolean

        __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string | Record<string, string>
        __QIANKUN_DEVELOPMENT__?: boolean
        Zone?: CallableFunction
        __ASMA__QIANKUN__SHELL__?: {
            loadMicroApp?: typeof loadMicroApp
        }
        __INIT_LOAD_MICROAPP__?: typeof initLoadMicroApp
    }
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test'
        }
    }
}

export {}
