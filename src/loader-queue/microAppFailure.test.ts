import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { reportFirstMicroAppFailure, type MicroAppLifecycle } from './microAppFailure.ts'

/** A micro-app whose two lifecycle promises are driven by the test. */
function fakeApp(): {
    app: MicroAppLifecycle
    failBootstrap: (error: unknown) => void
    failMount: (error: unknown) => void
    finishBootstrap: () => void
    finishMount: () => void
} {
    let failBootstrap!: (error: unknown) => void
    let finishBootstrap!: () => void
    let failMount!: (error: unknown) => void
    let finishMount!: () => void
    const bootstrapPromise = new Promise<unknown>((resolve, reject) => {
        finishBootstrap = () => resolve(undefined)
        failBootstrap = reject
    })
    const mountPromise = new Promise<unknown>((resolve, reject) => {
        finishMount = () => resolve(undefined)
        failMount = reject
    })
    return { app: { bootstrapPromise, mountPromise }, failBootstrap, failMount, finishBootstrap, finishMount }
}

/** Let every already-scheduled microtask run. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

describe('reportFirstMicroAppFailure', () => {
    it('reports a mount failure even when bootstrap succeeded', async () => {
        // The ASMA-7853 shape exactly: the shell's placeholder lifecycle warns on bootstrap and
        // throws on mount. Watching bootstrap alone would report nothing at all here.
        const errors: unknown[] = []
        const { app, finishBootstrap, failMount } = fakeApp()
        reportFirstMicroAppFailure(app, (error) => errors.push(error))

        finishBootstrap()
        failMount(new Error('micro-app "asma-app-office" exposed no qiankun lifecycle'))
        await settle()

        assert.equal(errors.length, 1)
        assert.match(String((errors[0] as Error).message), /exposed no qiankun lifecycle/)
    })

    it('reports a bootstrap failure', async () => {
        const errors: unknown[] = []
        const { app, failBootstrap, finishMount } = fakeApp()
        reportFirstMicroAppFailure(app, (error) => errors.push(error))

        failBootstrap(new Error('entry 404'))
        finishMount()
        await settle()

        assert.deepEqual(
            errors.map((e) => (e as Error).message),
            ['entry 404'],
        )
    })

    it('reports one error when both promises reject, and it is the first', async () => {
        // single-spa marks a broken app SKIP_BECAUSE_BROKEN, so both promises reject for the one
        // underlying failure. Two reports would show one broken widget as two.
        const errors: unknown[] = []
        const { app, failBootstrap, failMount } = fakeApp()
        reportFirstMicroAppFailure(app, (error) => errors.push(error))

        failBootstrap(new Error('first'))
        failMount(new Error('second'))
        await settle()

        assert.deepEqual(
            errors.map((e) => (e as Error).message),
            ['first'],
        )
    })

    it('reports nothing while the app is healthy', async () => {
        const errors: unknown[] = []
        const { app, finishBootstrap, finishMount } = fakeApp()
        reportFirstMicroAppFailure(app, (error) => errors.push(error))

        finishBootstrap()
        finishMount()
        await settle()

        assert.deepEqual(errors, [])
    })

    it('reports nothing after cancel — an unmounted host must not be told', async () => {
        const errors: unknown[] = []
        const { app, failMount } = fakeApp()
        const cancel = reportFirstMicroAppFailure(app, (error) => errors.push(error))

        cancel()
        failMount(new Error('too late'))
        await settle()

        assert.deepEqual(errors, [])
    })

    it('leaves no unhandled rejection behind', async () => {
        // The console noise this replaces was itself unhandled rejections; producing more of them
        // while reporting would trade one silent failure for another.
        const seen: unknown[] = []
        const onUnhandled = (reason: unknown) => seen.push(reason)
        process.on('unhandledRejection', onUnhandled)
        try {
            const { app, failBootstrap, failMount } = fakeApp()
            reportFirstMicroAppFailure(app, () => {})
            failBootstrap(new Error('boom'))
            failMount(new Error('boom too'))
            await settle()
            await settle()
        } finally {
            process.off('unhandledRejection', onUnhandled)
        }
        assert.deepEqual(seen, [])
    })
})
