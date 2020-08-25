export function polarToCartesian({center: {x, y}, radius, angleDeg}) {
    const angleRad = ((angleDeg-90) / 360) * (2*Math.PI) 
    return {
        x: x + (radius * Math.cos(angleRad)),
        y: y + (radius * Math.sin(angleRad)),
    }
}


export function circumference(radius) {
	return 2*Math.PI*radius
}

import { setWith, clone } from 'lodash'

export const setIn = (obj, path, val) => (
	setWith(clone(obj), path, val, clone)
)

