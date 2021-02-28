import React, { useState, useReducer, useRef, Fragment, useCallback } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
// import { HTML5Backend as DndBackend } from 'react-dnd-html5-backend'
import DndBackend from 'react-dnd-mouse-backend'

import { keyBy, noop, max, cloneDeep, omit, identity } from 'lodash'

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
    const [state, dispatch] = useReducerWithResult(update, {shapes: INIT_SHAPES})
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

import { Container, Row, Col, Card, ListGroup, Button } from 'react-bootstrap'
import { GithubPicker as ColorPicker } from 'react-color'


const COLORS = {
    selected: '#007bff',
}

export const App = ({state: {shapes}, dispatch}) => {
    const [_selectedId, setSelectedId] = useState(null)
    const selectedId = _selectedId in shapes ? _selectedId : null
    const [isPickingNew, setIsPickingNew] = useState(false)
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
                                            dispatch({type: 'MOVE_SHAPE', id, position})
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
                                    {Object.values(shapes).map((shape) => {
                                        const {name: shapeName} = shapeTypes[shape.type]
                                        const shapeId = shape.id
                                        const isSelected = shapeId === selectedId
                                        return (
                                            <ListGroup.Item active={isSelected} action key={shapeId} onClick={() => setSelectedId(shapeId)}>
                                                <div style={{display: 'flex'}}>
                                                <span>
                                                    <InlineCircle color={shape.color}/>
                                                    <span style={{marginLeft: '0.5em'}}>{shapeName}</span>
                                                    {shape.label && <span style={{marginLeft: '0.5em', color: 'rgba(0,0,0,0.35)'}}>{shape.label}</span>}
                                                </span>
                                                <Button variant="link" className="btn-link-monochrome" title="Delete shape"
                                                    style={{
                                                        marginLeft: 'auto',
                                                        paddingTop: 0,
                                                        paddingBottom: 0,
                                                    }}
                                                    onClick={() => {
                                                        dispatch({type: 'DELETE_SHAPE', id: shapeId})
                                                        setSelectedId(null)
                                                    }}
                                                >
                                                    &times;
                                                </Button>
                                                </div>
                                            </ListGroup.Item>
                                        )
                                    })}
                                    {isPickingNew
                                        ? <ListGroup.Item variant="light">
                                            <div style={{display: 'flex'}}>
                                                <span>Select a shape to add</span>
                                                <Button variant="light" size="sm" style={{marginLeft: 'auto'}} onClick={() => setIsPickingNew(false)}>Cancel</Button>
                                            </div>
                                            <ShapePicker shapeTypes={shapeTypes} onSelect={(shapeType) => {
                                                const newId = dispatch({type: 'CREATE_SHAPE', shapeType})
                                                setIsPickingNew(false)
                                                setSelectedId(newId)
                                            }
                                            } />
                                        </ListGroup.Item>
                                        : <ListGroup.Item action variant="light" onClick={() => setIsPickingNew(true)}>
                                           <span><strong>+</strong> Add new</span>
                                        </ListGroup.Item>
                                    }
                                </ListGroup>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Container>
    )
}


const debugReducer = (f) => (state, action) => {
    console.log('REDUCER DEBUG :: running action', action, state)
    const res = f(state, action)
    console.log('REDUCER DEBUG :: new state + result', ...res)
    return res
}


const SHOULD_DEBUG_REDUCER = true
const reducerWrapper = SHOULD_DEBUG_REDUCER ? debugReducer : identity

const only = (x) => [x, undefined]
const update = reducerWrapper((state, action) => {
    switch (action.type) {
        case 'MOVE_SHAPE': {
            const {id, position} = action
            return only(setIn(state, ['shapes', id, 'position'], position))
        }
        case 'UPDATE_SHAPE': {
            const {id, type: _, ...props} = action
            return only(setIn(state, ['shapes', id], {...state.shapes[id], ...props}))
        }
        case 'CREATE_SHAPE': {
            const {shapeType} = action
            const id = max(Object.values(state.shapes).map((s) => s.id)) + 1
            const shape = {id, type: shapeType, position: 0, ...cloneDeep(shapeTypes[shapeType].defaults)}
            return [setIn(state, ['shapes', id], shape), id]
        }
        case 'DELETE_SHAPE': {
            const {id} = action
            return only(setIn(state, ['shapes'], omit(state.shapes, id)))
        }
        default: {
            return only(state)
        }
    }
})



const useReducerWithResult = (update, initialState) => {
    const [state, setState] = useState(initialState)
    const dispatch = useCallback((action) => {
        const [nextState, result] = update(state, action)
        if (!Object.is(state, nextState)) {
            setState(nextState)
        }
        return result
    }, [state])
    return [state, dispatch]
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


const InlineCircle = ({color}) => (
    <svg style={{display: 'inline', width: '1em', height:'1em'}} viewBox="0 0 10 10">
        <circle cx={5} cy={5} r={5} fill={color}/>
    </svg>
)

const ShapePicker = ({shapeTypes, columns = 3, onSelect=noop}) => {
    return (
        <div style={{display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`}}>
            {Object.entries(shapeTypes).map(([type, {name}]) => (
                <div key={type} style={{padding: '1em', margin: '0.5em', textAlign: 'center', cursor: 'pointer'}} onClick={() => onSelect(type)}>
                    <div style={{fontSize: '3em', color: 'rgba(0,0,0, 0.35)'}}>
                        {name[0]}
                    </div>
                    <div>{name}</div>
                </div>
            ))}
        </div>
    )
}