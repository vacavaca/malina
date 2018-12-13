import { curry } from 'ramda'

export default props => {
  const state = {
    cellSize: props.cellSize,
    fieldSize: props.fieldSize,
    initialSpeed: props.speed || 1,
    focusHook: null
  }

  return reset(state)
}

export const posEqual = (a, b) =>
  a.x === b.x && a.y === b.y

export const posEqualAny = (pos, arr) =>
  !arr.every(check => !posEqual(pos, check))

export const posAdd = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y
})

export const getRandomPosOnField = state => ({
  x: Math.floor(Math.random() * state.fieldSize),
  y: Math.floor(Math.random() * state.fieldSize),
})

export const getRandomDirection = () => {
  const dir = Math.random() - 0.5
  const sign = Math.sign(Math.random() - 0.5)
  return { x: dir >= 0 ? sign : 0, y: dir < 0 ? sign : 0 }
}

export const getNewApplePos = state => {
  if (state.snake.length === (state.fieldSize * state.fieldSize))
    return null

  let next = null
  while (next == null || posEqualAny(next, state.snake))
    next = getRandomPosOnField(state)

  return next
}

export const constrainLength = curry((len, val) => {
  if (val >= 0) return val % len
  else return len - ((-val) % len)
})

export const constrainPos = curry((state, pos) => ({
  x: constrainLength(state.fieldSize, pos.x),
  y: constrainLength(state.fieldSize, pos.y)
}))

export const gridLengthToScreen = curry((state, val) => state.cellSize * val)

export const gridPosToScreen = curry((state, pos) => ({
  x: gridLengthToScreen(state, pos.x),
  y: gridLengthToScreen(state, pos.y),
}))

export const screenLengthToGrid = curry((state, val) =>
  Math.floor(val / state.cellSize))

export const screenPosToGrid = curry((state, pos) => ({
  x: screenLengthToGrid(state, pos.x),
  y: screenLengthToGrid(state, pos.y)
}))

export const reset = state => {
  const next = {
    ...state,
    speed: state.initialSpeed || 1,

    snake: [],
    apple: null,
    direction: null,
    gameLoop: null,
    gameOver: false,
    score: 0,
    paused: true
  }

  let direction = null
  while (direction == null || (direction.x == 0 && direction.y == 0))
    direction = getRandomDirection()

  const head = getRandomPosOnField(next)
  next.snake = [head]
  for (let i = 1; i < 3; i++)
    next.snake.unshift(constrainPos(state, posAdd(next.snake[0], direction)))

  next.apple = getNewApplePos(next)
  return next
}