import { h, view, withContext, decorator } from '../ui/index'
import { compose } from '../util'

const key = Symbol('store')

export const connectStore = compose(
  withContext(({ [key]: store }) => ({ store }))
)

const state = {
  state: null
}

const actions = {}

actions.update = updater => async state => {
  const next = { ...state }
  const result = updater(next)
  if (result instanceof Promise)
    await result

  return { state: next }
}

const connectUpdater = decorator(Inner =>
  view(
    ({ state }, actions, children) =>
      h(Inner, { store: { state: state, update: actions.update } }, children),
    state, actions))

export const withStore = compose(
  connectUpdater,
  connectStore
)
