import { h, view } from 'malina'
import { connect } from 'malina-decorator'
import { omit } from 'malina-util'
import { Route } from 'malina-router'

const mapStoreState = store => ({ ready: store.animationsReady })

const state = {
  invert: false,

  ready: false,
  prev: false
}

const reserved = Object.keys(state)

const hooks = {}

hooks.mount = (_, state) => {
  state.prev = state.match
}

hooks.update = (_, state) => {
  state.prev = state.match
}

const getTransition = (state, direction) => {
  if (direction == null)
    return null

  if (!state.invert) return direction ? 'in' : 'out'
  else return direction ? 'out' : 'in'
}

const getStateFromView = state => {
  if (!state.prev && state.match)
    return getTransition(state, true)

  if (state.prev && !state.match)
    return getTransition(state, false)

  return null
}

const Animator = view(
  (state, _, children) => {
    const render = children[0] || null
    if (render == null)
      return null

    let transition = null
    if (state.ready)
      transition = getStateFromView(state)

    const animationState = getTransition(state, state.match)

    return render(animationState, transition)
  }, state, {}, hooks).decorate(connect(mapStoreState))

export default view(
  (state, _, children) => <Route {...omit(reserved, state)}>{
    params => <Animator invert={state.invert} match={params != null}>{children}</Animator>
  }</Route>
)
