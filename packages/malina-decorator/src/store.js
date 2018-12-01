import { h, view, decorator } from 'malina'
import { shallowEqual, keys } from 'malina-util'
import { withTemplate } from './common'
import { getContext, withContext } from './context'

const actions = {}

actions.update = updater => async ({ store }) => {
  let next = { ...store }
  let result = updater
  if (updater instanceof Function)
    result = updater(next)

  if (result instanceof Promise)
    result = await result

  if (result != null)
    next = { ...next, ...result }

  if (!shallowEqual(store, next))
    return { store: next }
}

const key = Symbol('store')

const passToContext = withContext((state, actions) =>
  ({ [key]: { state: state.store, update: actions.update } }))

const getStoreView = initial =>
  passToContext(view((s, a, children) => children, { store: initial }, actions))

export const withStore = initial => decorator(Inner => {
  const Store = getStoreView(initial)

  return withTemplate(original => (state, actions, children) =>
    h(Store, { store: initial }, original(state, actions, children)))(Inner)
})

const empty = (...a) => ({})

export const connect = (mapState = empty, mapUpdate = empty) =>
  getContext(ctx => {
    if (key in ctx) {
      const store = ctx[key]
      return {
        ...mapState(store.state),
        ...mapUpdate(store.update)
      }
    } else return {}
  })

export const bindActions = actions => update => {
  const bound = {}
  for (const key of keys(actions)) {
    const action = actions[key]
    if (action instanceof Function)
      bound[key] = (...args) => update(action(...args))
    else bound[key] = bindActions(action)
  }

  return bound
}
