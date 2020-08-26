export function polarToCartesian({center: {x, y}, radius, angleDeg}) {
    const angleRad = ((angleDeg-90) / 360) * (2*Math.PI) 
    return {
        x: x + (radius * Math.cos(angleRad)),
        y: y + (radius * Math.sin(angleRad)),
    }
}

export function cartesianToPolar({center, x, y}) {
	x = x - center.x
	y = y - center.y
    const radius = Math.sqrt(x*x + y*y)
    const angleRad = Math.atan2(y, x) // y first!
    const angleDeg = (angleRad / (2*Math.PI)) * 360 + 90
    return { angleDeg, radius }
}


export function circumference(radius) {
	return 2*Math.PI*radius
}

import { setWith, clone } from 'lodash'

export const setIn = (obj, path, val) => (
	setWith(clone(obj), path, val, clone)
)

