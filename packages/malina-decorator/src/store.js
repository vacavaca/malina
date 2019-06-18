import { h, view, decorator } from 'malina'
import { shallowEqual, keys, compose } from 'malina-util'
import { withTemplate, withState, withActions } from './common'
import { getContext, withContext } from './context'

const actions = {}

actions.finishUpdate = update => ({ state }) => {
  const next = { ...state.store, ...update }
  if (!shallowEqual(state.store, next))
    return { store: next }
}

actions.update = updater => async ({ state, actions }) => {
  let next = { ...state.store }
  let result = updater
  if (updater instanceof Function)
    result = updater(next)

  if (result instanceof Promise)
    result = await result

  if (result != null)
    await actions.finishUpdate(result)
}

const wrapUpdate = update => async (...args) => {
  const result = await update(...args)
  return result.store
}

const key = Symbol.for('__malina_store')

const passToContext = compose(
  withContext(({ state, actions }) =>
    ({ [key]: { state: state.store, update: wrapUpdate(actions.update) } }))
)

const StoreView = view(
  withTemplate(({ state, children }) => h(state.view, state.passed, children)),
  withState({ store: null }),
  withActions(actions),
  passToContext
)

export const withStore = initial => decorator(Inner =>
  ({ state, children }) => h(StoreView, { store: initial, passed: state, view: Inner }, children))

const empty = (...a) => ({})

export const connect = (mapState = empty, mapUpdate = empty) =>
  getContext(ctx => {
    if (key in ctx) {
      const store = ctx[key]
      const normMapState = mapState != null ? mapState : empty
      const normMapUpdate = mapUpdate != null ? mapUpdate : empty
      return {
        ...normMapState(store.state),
        ...normMapUpdate(store.update)
      }
    } else return {}
  })

export const bindActions = actions => update => {
  const bound = {}
  for (const key of keys(actions)) {
    const action = actions[key]
    if (action instanceof Function)
      bound[key] = (...args) => update(action(...args))
    else bound[key] = bindActions(action)(update)
  }

  return bound
}
