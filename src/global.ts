/* export interface QiankunWindow {
    __POWERED_BY_QIANKUN__?: boolean
    [x: string]: any
}
declare global {
    interface Window {
        __POWERED_BY_QIANKUN__?: boolean

        __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string | Record<string, string>
        __QIANKUN_DEVELOPMENT__?: boolean
        Zone?: CallableFunction
        __GLOBAL_CONCURENT_QIANKUN__?: Record<string, QiankunWindow>
    }
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test'
        }
    }
}
 */
export {}
