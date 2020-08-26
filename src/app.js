import React, { useState, useReducer, useRef, Fragment } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
// import { HTML5Backend as DndBackend } from 'react-dnd-html5-backend'
import DndBackend from 'react-dnd-mouse-backend'

import { keyBy } from 'lodash'

import shapeTypes from './shapes'
import { setIn, cartesianToPolar } from './utils'

const SIDE = 300
const CENTER = { x: SIDE/2, y: SIDE/2 }
const RADIUS = 0.8 * SIDE/2


const INIT_SHAPES = keyBy([
    {id: 15, type: 'core/arc', position: -40, length: 30, color: 'green',  label: 'GET',  thickness: 20},
    {id: 17, type: 'core/arc', position: 20,  length: 30, color: 'tomato', label: 'BENT', thickness: 20},
    {id: 20, type: 'core/circle', position: 75,  size: 10, color: 'blue'},
], 'id')

export const Root = () => {
    const [state, dispatch] = useReducer(update, {shapes: INIT_SHAPES})
    return (
        <DndProvider debugMode backend={DndBackend}>
            <App state={state} dispatch={dispatch}/>
        </DndProvider>
    )
}


const nodeCenter = (node) => {
    const rect = node.getBoundingClientRect()
    return {
        x: rect.left + rect.width/2,
        y: rect.top  + rect.height/2
    }
}



const getDragAngleDiff = ({center, pointerInitial, pointerCurrent}) => {
    const {angleDeg: pointerAngleInitial} = cartesianToPolar({center, ...pointerInitial})
    const {angleDeg: pointerAngleCurrent} = cartesianToPolar({center, ...pointerCurrent})
    return (pointerAngleCurrent - pointerAngleInitial)
}

const collectDragAngle = (monitor) => {
    const isDragging = monitor.isDragging()
    if (!isDragging) {
        return { isDragging }
    }
    const pointerInitial = monitor.getInitialClientOffset()
    const pointerCurrent = monitor.getClientOffset()
    return {
        isDragging,
        dragAngleDiff: (center) => getDragAngleDiff({
            center, pointerInitial, pointerCurrent
        })

    }
}

export const App = ({state: {shapes}, dispatch}) => {
    const [selectedId, setSelectedId] = useState(null)
    const circleRef = useRef()
    // const [, dropRef] = useDrop({
    //     accept: ItemTypes.OBJECT,
    // })
    return (
        <div>
            <div style={{width: `${SIDE}px`, height: `${SIDE}px`}}>
                <svg style={{width: '100%', height: '100%'}}>
                    <circle ref={circleRef}
                        cx={CENTER.x}
                        cy={CENTER.y}
                        r={RADIUS}
                        stroke="gray" fill="none"
                    >
                    </circle>
                    {Object.values(shapes).map((shape) => {
                        const {id, type} = shape
                        const Shape = shapeTypes[type]
                        return (
                            <Draggable
                                key={id}
                                item={{type: ItemTypes.OBJECT, id}}
                                collect={collectDragAngle}
                                end={(_, monitor) => {
                                    if (circleRef.current) {
                                        const { dragAngleDiff } = collectDragAngle(monitor)
                                        const angleDiff = dragAngleDiff(nodeCenter(circleRef.current))
                                        const position = shapes[id].position + angleDiff
                                        dispatch({type: 'MOVE_TO', position, id})
                                    }
                                }}
                            >
                                {([{isDragging, dragAngleDiff}, dragRef]) => {
                                    let shape2
                                    if (isDragging && circleRef.current) {
                                        const angleDiff = dragAngleDiff(nodeCenter(circleRef.current))
                                        const position = shapes[id].position + angleDiff
                                        shape2 = {...shape, color: 'orange', position}
                                    } else {
                                        shape2 = shape
                                    }
                                    return <g ref={dragRef} className="cursor-draggable">
                                        <Shape
                                            center={CENTER}
                                            radius={RADIUS}
                                            {...shape2}
                                            onClick={() => setSelectedId(id)}
                                        />
                                    </g>
                                }}
                            </Draggable>
                        )
                    })}
                    
                </svg>
            </div>
            {(selectedId !== null) && (
                <PositionControl
                    {...{selectedId, shapes}}
                    onSetPosition={(position) => dispatch({type: 'MOVE_TO', id: selectedId, position})}
                />
            )}
        </div>
    )
}

const update = (state, action) => {
    switch (action.type) {
        case 'MOVE_TO': {
            const {id, position} = action
            return setIn(state, ['shapes', id, 'position'], position)
        }
        default: {
            return state
        }
    }
}


const PositionControl = ({selectedId, shapes, onSetPosition}) => {
    return (
        <div>
            <label>
                <span>position</span>
                <input
                    type="number"
                    value={shapes[selectedId].position}
                    step="5"
                    onChange={({target: {value}}) => onSetPosition(Number(value))}
                />
            </label>
        </div>

    )
}

export const ItemTypes = {
    OBJECT: 'object',
}

const Draggable = ({children: render, ...dragProps}) => {
    const drag = useDrag(dragProps)
    return render(drag)
}