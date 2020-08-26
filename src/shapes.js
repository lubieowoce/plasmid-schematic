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


const Terminator = ({center, radius, position, size, color='black', label=null, onClick=noop}) => {
    const pos = polarToCartesian({center, radius, angleDeg: position})
    return (
        <g transform={`translate(${pos.x} ${pos.y}) rotate(${position})`} onClick={onClick}>
            <line
                strokeWidth="3"
                stroke={color}
                x1="0" y1="0"
                x2="0" y2={-size}
            />
            <line
                strokeWidth="3"
                stroke={color}
                x1={-size/2} y1={-size}
                x2={size/2} y2={-size}
            />
            {(label!==null) &&
                <text y={-1.25*size} fontSize="0.8em" textAnchor="middle">
                    {label}
                </text>}
        </g>
    )
}


const Promoter = ({center, radius, position, size, color='black', label=null, onClick=noop}) => {
    const pos = polarToCartesian({center, radius, angleDeg: position})
    return (
        <g
            transform={`translate(${pos.x} ${pos.y}) rotate(${position}) scale(0.5)`}
            stroke-width="6"
            stroke-miterlimit="10"
            onClick={onClick}
        >
            {(label!==null) &&
                <Fragment>
                    <text transform="translate(0 66.4556)"  textAnchor="middle" font-size="25px">{label}</text>
                    <line fill="none" stroke="#808285" stroke-dasharray="5.2,5.2" x1="0" y1="0" x2="0" y2="41.4"/>
                </Fragment>
            }
            <polyline fill="none" stroke={color} stroke-miterlimit="10" points="22,-54.5 0,-54.5 0,0     "/>
            <polyline fill="#FFFFFF" stroke={color} stroke-miterlimit="10" points="22,-54.4 22.1,-73.9 47.3,-55.8 22,-36 22,-54.5"/>
        </g>
    )
}


const CodingRegion = ({id, center, radius, position, length, thickness, label=null, color='gray', onClick=noop}) => {
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


function thickArc({center, radius, position: startAngle, length: arcLength, thickness, caps='both'}){
    const [startCap, endCap] = (
        caps === 'none'  ? [false, false] :
        caps === 'start' ? [true,  false] :
        caps === 'end'   ? [false, true ] :
        caps === 'both'  ? [true,  true ] :
                           [false, false]
    )
    arcLength = Math.max(1, Math.min(arcLength, 359))
    const endAngle = startAngle + arcLength
    const radiusInner = radius - (thickness/2)
    const startPtInner = polarToCartesian({center, radius: radiusInner, angleDeg: startAngle})
    const endPtInner   = polarToCartesian({center, radius: radiusInner, angleDeg: endAngle})

    const thicknessCircFrac = thickness / circumference(radius)
    const arrowPtStart = polarToCartesian({center, radius: radius, angleDeg: startAngle + 360*thicknessCircFrac/2})
    const arrowPtEnd   = polarToCartesian({center, radius: radius, angleDeg: endAngle   + 360*thicknessCircFrac/2})

    const radiusOuter = radius + (thickness/2)
    const startPtOuter = polarToCartesian({center, radius: radiusOuter, angleDeg: endAngle})
    const endPtOuter   = polarToCartesian({center, radius: radiusOuter, angleDeg: startAngle})

    const largeArc = arcLength <= 180 ? 0 : 1
    return [
        "M", startPtInner.x, startPtInner.y, 
        "A", radiusInner, radiusInner, 0, largeArc, /*sweep*/ 1, endPtInner.x, endPtInner.y,
        ...(endCap ? ["L", arrowPtEnd.x, arrowPtEnd.y] : []),
        "L", startPtOuter.x, startPtOuter.y,
        "A", radiusOuter, radiusOuter, 0, largeArc, /*sweep*/ 0, endPtOuter.x, endPtOuter.y,
        ...(startCap ? ["L", arrowPtStart.x, arrowPtStart.y] : []),
        "L", startPtInner.x, startPtInner.y,
        // "z",
    ].join(" ")
}



export default {
    'core/coding-region': CodingRegion,
    'core/circle': Circle,
    'core/terminator': Terminator,
    'core/promoter': Promoter,
}