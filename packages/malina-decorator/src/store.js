import { h, view, decorator } from 'malina'
import { compose, shallowEqual } from 'malina-util'
import { mapState, withHooks } from './common'
import { getContext, withContext } from './context'

// const key = Symbol('store')

// const mapStore = (store, mappers) => mappers.reduce((a, mapper) => {
//   Object.assign(a, mapper(store))
//   return a
// }, {})

// export const connect = (...mappers) => compose(
//   getContext(ctx => key in ctx ? mapStore(ctx[key].ref, mappers) : {}),
//   withContext(({ store }) => store != null ? { [key]: { ref: store } } : {})
// )

// const actions = {}

// actions.update = updater => async ({ state }) => {
//   let next = { ...state }
//   let result = updater
//   if (updater instanceof Function)
//     result = updater(next)

//   if (result instanceof Promise)
//     result = await result

//   if (result != null)
//     next = { ...next, ...result }

//   return { state: next }
// }

// const connectUpdater = initial => decorator(Inner => {
//   const Provided = compose(
//     getContext(ctx => key in ctx ? { store: ctx[key].ref } : {}),
//     withContext(({ ref }) => ({ [key]: ref })),
//     mapState(({ ref, ...rest }) => ({ ...rest }))
//   )(Inner)

//   return view(
//     ({ state, ref, ...rest }, actions, children) => {
//       ref.state = state
//       ref.update = actions.update
//       return h(Provided, { ...rest, ref: { ref } }, children)
//     }, { state: { ...initial }, ref: {} }, actions)
// })

// export const withStore = (initial = {}) => connectUpdater(initial)

// export const bindActions = actions => store => {
//   const bound = {}
//   for (const key in actions) {
//     const action = actions[key]
//     if (action instanceof Function) bound[key] = (...args) => action(store)(...args)
//     else if (typeof action === 'object') bound[key] = bindActions(action)(store)
//   }

//   return bound
// }

const state = {
  store: null
}

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
  else return
}

const getStoreView = initial => view((s, a, children) => children, { store: initial }, actions)

const withStore = initial => decorator(Inner => {
  const Store = getStoreView(initial)

  return mapTemplate(original => (state, actions, children) =>
    h(Store, { store: initial }, original(state, actions, children)))(Inner)
})


// const ctxKey = Symbol('store')
// const stateKey = ctxKey
// const actionKey = Symbol('store-update')

// const withStore = initial => compose(
//   withContext((state, actions) => ({
//     [key]: 
//   }))
//   withHooks({
//     create: original => (_, state, actions) => {
//       original()
//       state[stateKey] = initial
//     }
//   })
// )