import { posEqual, posAdd, constrainPos, getNewApplePos, reset } from './state'

const actions = {}

actions.move = (x, y) => ({ snake, prevDirection }) => {
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

actions.tick = () => (state, actions) => {
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

actions.start = () => (state, actions) => ({
  gameLoop: setInterval(actions.tick, 1000 / state.speed),
  paused: false
})

actions.countApple = () => state => {
  const score = state.score + 1
  if (state.onScore != null)
    state.onScore(score)

  return { score }
}

actions.speedUp = () => state => {
  const lenPart = Math.min(1, state.snake.length / (1 * state.fieldSize))
  const max = state.fieldSize * 0.3
  return { speed: max * lenPart + state.initialSpeed * (1 - lenPart) }
}

actions.progress = () => (_, actions) => {
  actions.pause()
  actions.start()
}

actions.pause = () => state => {
  if (state.gameLoop !== null)
    clearTimeout(state.gameLoop)
  return { gameLoop: null, paused: true }
}

actions.focus = e => ({ focusHook, gameLoop }, actions) => {
  focusHook.focus()
  if (gameLoop == null)
    actions.start()
}

actions.reset = () => state => {
  if (state.onScore != null)
    state.onScore(0)

  return reset(state)
}

actions.restart = () => (_, actions) => {
  actions.pause()
  actions.reset()
  actions.focus()
}

const
  KEY_UP = 38,
  KEY_DOWN = 40,
  KEY_LEFT = 37,
  KEY_RIGHT = 39

actions.handleKeyDown = e => (_, actions) => {
  e.preventDefault()
  if (e.keyCode === KEY_UP) actions.move(0, -1)
  if (e.keyCode === KEY_DOWN) actions.move(0, 1)
  if (e.keyCode === KEY_LEFT) actions.move(-1, 0)
  if (e.keyCode === KEY_RIGHT) actions.move(1, 0)
}

actions.handleClick = () => (state, actions) => {
  if (!state.gameOver) actions.focus()
  else actions.restart()
}

actions.handleBlur = () => (_, actions) => {
  actions.pause()
}


export default actions
