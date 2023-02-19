import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
function useForce() {
    const [value, setValue] = useState(0); // integer state
    return [value, () => setValue((value) => value + 1)]; // update state to force render
    // An function that increment 👆🏻 the previous state like here
    // is better than directly setting `value + 1`
}
let forceUpdate;
const MicroAppC = () => {
    const [value, force] = useForce();
    console.log('forceUpdate', value);
    forceUpdate = force;
    return (_jsx("div", { style: { height: '100%', width: '100%' }, children: _jsx("div", { id: 'micro-app', children: "micro app container" }) }));
};
export const MicroAppConatiner = _jsx(MicroAppC, {});
export function render({ loading }) {
    console.log('render Loading', loading);
    forceUpdate?.();
}
//# sourceMappingURL=MicroAppContainer.js.map