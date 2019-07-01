import { posEqual, posAdd, constrainPos, getNewApplePos, reset as resetState } from './state'

export const move = (x, y) => ({ state: { snake, prevDirection } }) => {
  const direction = { x, y }
  if (prevDirection != null && posEqual(direction, prevDirection))
    return

  if (snake.length > 1) {
    const len = snake.length
    const head = snake[len - 1]
    const prev = snake[len - 2]
    if (posEqual(posAdd(head, direction), prev))
      return
  }

  return { direction }
}

export const tick = () => ({ state, actions }) => {
  if (state.gameOver || state.direction == null)
    return

  let len = state.snake.length
  const eated = posEqual(state.snake[len - 1], state.apple)
  const snake = state.snake
    .slice(eated ? 0 : 1)
    .concat([posAdd(state.snake[len - 1], state.direction)])
    .map(constrainPos(state))

  len = state.snake.length
  const head = state.snake[len - 1]
  const collided = !state.snake.every((pos, i) => !posEqual(head, pos) || i === len - 1)
  if (collided || snake.length === Math.pow(state.fieldSize, 2)) {
    actions.pause()
    return { gameOver: true }
  }

  const eating = posEqual(state.snake[len - 1], state.apple)
  const apple = eating ? getNewApplePos(state) : state.apple

  if (eating) {
    actions.countApple()
    actions.speedUp()
    actions.progress()
  }

  return { snake, apple }
}

export const start = () => ({ state, actions }) => ({
  gameLoop: setInterval(actions.tick, 1000 / state.speed),
  paused: false
})

export const countApple = () => ({ state }) => {
  const score = state.score + 1
  if (state.onScore != null)
    state.onScore(score)

  return { score }
}

export const speedUp = () => ({ state }) => {
  const lenPart = Math.min(1, state.snake.length / (1 * state.fieldSize))
  const max = state.fieldSize * 0.3
  return { speed: max * lenPart + state.initialSpeed * (1 - lenPart) }
}

export const progress = () => ({ actions }) => {
  actions.pause()
  actions.start()
}

export const pause = () => ({ state }) => {
  if (state.gameLoop !== null)
    clearTimeout(state.gameLoop)
  return { gameLoop: null, paused: true }
}

export const focus = e => ({ state: { focusHook, gameLoop }, actions }) => {
  focusHook.focus()
  if (gameLoop == null)
    actions.start()
}

export const reset = () => ({ state }) => {
  if (state.onScore != null)
    state.onScore(0)

  return resetState(state)
}

export const restart = () => ({ actions }) => {
  actions.pause()
  actions.reset()
  actions.focus()
}

const KEY_UP = 38
const KEY_DOWN = 40
const KEY_LEFT = 37
const KEY_RIGHT = 39

export const handleKeyDown = e => ({ actions }) => {
  e.preventDefault()
  if (e.keyCode === KEY_UP) actions.move(0, -1)
  if (e.keyCode === KEY_DOWN) actions.move(0, 1)
  if (e.keyCode === KEY_LEFT) actions.move(-1, 0)
  if (e.keyCode === KEY_RIGHT) actions.move(1, 0)
}

export const handleClick = () => ({ state, actions }) => {
  if (!state.gameOver) actions.focus()
  else actions.restart()
}

export const handleBlur = () => ({ actions }) => {
  actions.pause()
}
