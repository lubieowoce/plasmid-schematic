import { noop, keyBy } from 'lodash'
import React, { Fragment } from 'react'

import {
    polarToCartesian,
    circumference,
} from './utils'

const Circle = ({center, radius, position, size, color='gray', onClick=noop}) => {
    const pos = polarToCartesian({center, radius, angleDeg: position})
    return <circle cx={pos.x} cy={pos.y} r={size} fill={color} onClick={onClick}/>
}

const Arc = ({id, center, radius, position, length, thickness, label=null, color='gray', onClick=noop}) => {
    const textCurveId = `${id}-text-curve`
    return (<Fragment>
        <path
            d={thickArc({center, radius, position, length, thickness})}
            stroke="black" fill={color}
            onClick={onClick}
        />
        { (label !== null) && (<Fragment>
            <path
                id={textCurveId}
                d={arc({center, radius, position, length})}
                stroke="none" fill="none"
            />
            <text>
                <textPath
                    fill="white"
                    xlinkHref={`#${textCurveId}`}
                    startOffset="50%"
                    textAnchor="middle"
                    dominantBaseline="central"
                >
                    {label}
                </textPath>
            </text>
        </Fragment>) }
    </Fragment>)
}


function arc({center, radius, position: startAngle, length: arcLength}){
    arcLength = Math.max(1, Math.min(arcLength, 359))
    const end = startAngle + arcLength
    const startPt = polarToCartesian({center, radius: radius, angleDeg: startAngle})
    const endPt   = polarToCartesian({center, radius: radius, angleDeg: end})

    const largeArc = arcLength <= 180 ? 0 : 1
    return [
        "M", startPt.x, startPt.y, 
        "A", radius, radius, 0, largeArc, /*sweep*/ 1, endPt.x, endPt.y,
    ].join(" ")
}


function thickArc({center, radius, position: startAngle, length: arcLength, thickness}){
    arcLength = Math.max(1, Math.min(arcLength, 359))
    const end = startAngle + arcLength
    const radiusInner = radius - (thickness/2)
    const startPtInner = polarToCartesian({center, radius: radiusInner, angleDeg: startAngle})
    const endPtInner   = polarToCartesian({center, radius: radiusInner, angleDeg: end})

    const thicknessCircFrac = thickness / circumference(radius)
    const arrowPt = polarToCartesian({center, radius: radius, angleDeg: end + 360*thicknessCircFrac/2})

    const radiusOuter = radius + (thickness/2)
    const startPtOuter = polarToCartesian({center, radius: radiusOuter, angleDeg: end})
    const endPtOuter   = polarToCartesian({center, radius: radiusOuter, angleDeg: startAngle})

    const largeArc = arcLength <= 180 ? 0 : 1
    return [
        "M", startPtInner.x, startPtInner.y, 
        "A", radiusInner, radiusInner, 0, largeArc, /*sweep*/ 1, endPtInner.x, endPtInner.y,
        "L", arrowPt.x, arrowPt.y,
        "L", startPtOuter.x, startPtOuter.y,
        "A", radiusOuter, radiusOuter, 0, largeArc, /*sweep*/ 0, endPtOuter.x, endPtOuter.y,
        "L", startPtInner.x, startPtInner.y,
        // "z",
    ].join(" ")
}



export default {
    'core/arc': Arc,
    'core/circle': Circle,
}