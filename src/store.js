import { h, view } from './ui/index'
import { decorator, withContext, getContext, mapState } from './decorator/index'
import { compose } from './util'

const key = Symbol('store')

const defaultMapper = store => ({ store })

export const connectStore = (mapper = defaultMapper) => compose(
  getContext(ctx => key in ctx ? mapper(ctx[key].ref) : {}),
  withContext(({ store }) => store != null ? { [key]: { ref: store } } : {})
)

const actions = {}

actions.update = updater => async ({ state }) => {
  let next = { ...state }
  let result = updater
  if (updater instanceof Function)
    result = updater(next)

  if (result instanceof Promise)
    result = await result

  if (result != null)
    next = { ...next, ...result }

  return { state: next }
}

const connectUpdater = initial => decorator(Inner => {
  const Provided = compose(
    getContext(ctx => key in ctx ? { store: ctx[key].ref } : {}),
    withContext(({ ref }) => ({ [key]: ref })),
    mapState(({ ref, ...rest }) => ({ ...rest }))
  )(Inner)

  return view(
    ({ state, ref, ...rest }, actions, children) => {
      ref.state = state
      ref.update = actions.update
      return h(Provided, { ...rest, ref: { ref } }, children)
    }, { state: { ...initial }, ref: {} }, actions)
})

export const withStore = (initial = {}) => connectUpdater(initial)

export const bindActions = actions => store => {
  const bound = {}
  for (const key in actions) {
    const action = actions[key]
    if (action instanceof Function) bound[key] = (...args) => action(store)(...args)
    else if (typeof action === 'object') bound[key] = bindActions(action)(store)
  }

  return bound
}
