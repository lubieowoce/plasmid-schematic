import React, { useState, useReducer, Fragment } from 'react'
import { keyBy } from 'lodash'

import shapeTypes from './shapes'
import { setIn } from './utils'


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
    return <App state={state} dispatch={dispatch}/>
}

export const App = ({state: {shapes}, dispatch}) => {
    const [selectedId, setSelectedId] = useState(null)
    return (
        <div>
            <div style={{width: `${SIDE}px`, height: `${SIDE}px`}}>
                <svg style={{width: '100%', height: '100%'}}>
                    <circle
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
                            <g key={id}>
                                <Shape
                                    center={CENTER}
                                    radius={RADIUS}
                                    {...shape}
                                    onClick={() => setSelectedId(id)}
                                />
                            </g>
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