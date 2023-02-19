import { useState } from 'react'

function useForce(): [value: number, useForce: () => void] {
    const [value, setValue] = useState(0) // integer state
    return [value, () => setValue((value) => value + 1)] // update state to force render
    // An function that increment 👆🏻 the previous state like here
    // is better than directly setting `value + 1`
}

let forceUpdate: () => void

const MicroAppC = () => {
    const [value, force] = useForce()

    console.log('forceUpdate', value)

    forceUpdate = force

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <div id='micro-app'>micro app container</div>
        </div>
    )
}

export const MicroAppConatiner = <MicroAppC />

export function render({ loading }: { loading: boolean }) {
    console.log('render Loading', loading)

    forceUpdate?.()
}
