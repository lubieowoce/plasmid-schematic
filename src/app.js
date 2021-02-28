import React, { useState, useReducer, useRef, Fragment } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
// import { HTML5Backend as DndBackend } from 'react-dnd-html5-backend'
import DndBackend from 'react-dnd-mouse-backend'

import { keyBy } from 'lodash'

import shapeTypes from './shapes'
import { setIn, cartesianToPolar } from './utils'

const SIDE = 400
const CENTER = { x: SIDE/2, y: SIDE/2 }
const RADIUS = 0.75 * SIDE/2


const INIT_SHAPES = keyBy([
    {id: 15, type: 'core/coding-region', position: -40, length: 30, color: '#008B02',  label: 'GET',  thickness: 20},
    {id: 17, type: 'core/coding-region', position: 20,  length: 30, color: '#B80000', label: 'BENT', thickness: 20},
    {id: 20, type: 'core/circle', position: 75,  size: 10, color: '#1273DE'},
    {id: 23, type: 'core/terminator', position: 7.5,  size: 25, label: "Tea"},
    {id: 27, type: 'core/promoter', position: -60,  size: 25, label: "YEAH1"},
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

import { Container, Row, Col, Card, ListGroup } from 'react-bootstrap'
import { GithubPicker as ColorPicker } from 'react-color'


const COLORS = {
    selected: '#007bff',
}

export const App = ({state: {shapes}, dispatch}) => {
    const [selectedId, setSelectedId] = useState(null)
    const circleRef = useRef()
    // const [, dropRef] = useDrop({
    //     accept: ItemTypes.OBJECT,
    // })
    return (
        <Container>
            <Row>
                <Col>
                    <svg style={{width: `${SIDE}px`, height: `${SIDE}px`}}>
                        <rect x="0" y="0" width={SIDE} height={SIDE} fill="white" onClick={() => setSelectedId(null)}/>
                        <circle ref={circleRef}
                            cx={CENTER.x}
                            cy={CENTER.y}
                            r={RADIUS}
                            stroke="gray" fill="none"
                        >
                        </circle>
                        {Object.values(shapes).map((shape) => {
                            const {id, type} = shape
                            const {render: Shape} = shapeTypes[type]
                            return (
                                <Draggable
                                    key={id}
                                    item={{type: ItemTypes.OBJECT, id}}
                                    collect={collectDragAngle}
                                    begin={() => setSelectedId(id)}
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
                                            shape2 = {...shape, color: COLORS.selected, position}
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
                </Col>
                <Col>
                    <Row>
                        <Col>
                            {(selectedId !== null)
                                ? (() => {
                                const shape = shapes[selectedId]
                                const {edit: Edit, name: shapeName} = shapeTypes[shape.type]
                                return (
                                    <Card>
                                        <Card.Header>Shape Properties: <strong>{shapeName}</strong></Card.Header>
                                        <Card.Body>
                                            <div className="box-sizing-content-box">
                                                <ColorPicker
                                                    triangle="hide"
                                                    value={shape.color}
                                                    onChange={({hex: color}) => dispatch({type: 'UPDATE_SHAPE', id: shape.id, color})}
                                                />
                                            </div>
                                            {Edit && <Edit
                                                {...shape}
                                                onChange={(update) => dispatch({type: 'UPDATE_SHAPE', id: shape.id, ...update})}
                                            />}
                                        </Card.Body>
                                    </Card>
                                )
                                }
                                )()

                                : (
                                    <Card>
                                        <Card.Header>Shape Properties</Card.Header>
                                        <Card.Body>
                                            <span style={{color: 'rgba(0,0,0, 0.35)', fontStyle: 'italic'}}>No shape selected.</span>
                                        </Card.Body>
                                    </Card>
                                )
                            }
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Card>
                                <Card.Header>All shapes</Card.Header>
                                <ListGroup variant="flush">
                                    {Object.entries(shapes).map(([shapeId, shape]) => {
                                        const {name: shapeName} = shapeTypes[shape.type]
                                        const isSelected = shapeId === selectedId
                                        return (
                                            <ListGroup.Item active={isSelected} action key={shapeId} onClick={() => setSelectedId(shapeId)}>
                                                <InlineCircle color={shape.color}/>
                                                <span style={{marginLeft: '0.5em'}}>{shapeName}</span>
                                                {shape.label && <span style={{marginLeft: '0.5em', color: 'rgba(0,0,0,0.35)'}}>{shape.label}</span>}
                                            </ListGroup.Item>
                                        )
                                    })}
                                </ListGroup>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Container>
    )
}

const InlineCircle = ({color}) => (
    <svg style={{display: 'inline', width: '1em', height:'1em'}} viewBox="0 0 10 10">
        <circle cx={5} cy={5} r={5} fill={color}/>
    </svg>
)


const update = (state, action) => {
    switch (action.type) {
        case 'MOVE_TO': {
            const {id, position} = action
            return setIn(state, ['shapes', id, 'position'], position)
        }
        case 'UPDATE_SHAPE': {
            const {id, type: _, ...props} = action
            return setIn(state, ['shapes', id], {...state.shapes[id], ...props})
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
                    onChange={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        const {target: {value}} = event
                        onSetPosition(Number(value))}
                    }
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