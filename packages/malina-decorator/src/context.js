import { h, isViewNode, isElementNode } from 'malina'
import { compose, shallowEqual } from 'malina-util'
import { memoizedDecorator } from './memoized'
import { withHooks, withActions, withTemplate } from './common'
import EventEmitter from './event-emitter'

const contextKey = Symbol('context')

class Context {
  constructor(value = {}) {
    this.value = value
    this.emitter = new EventEmitter()
  }

  subscribe(listener) {
    return this.emitter.subscribe(listener)
  }

  update(value) {
    const next = { ...this.value, ...value }
    if (shallowEqual(this.value, next))
      return

    this.value = next
    this.emitter.notify(this.value)
  }

  get() {
    return this.value
  }
}

const provideContext = memoizedDecorator(withTemplate(original =>
  (state, actions, children) => {
    const context = state[contextKey]
    const node = original(state, actions, children)
    if (context != null) return decorateTemplate(context)(node)
    else return node
  }))

const decorateTemplate = context => node => {
  if (!Array.isArray(node)) {
    if (isViewNode(node)) {
      const attrs = { ...(node.attrs != null ? node.attrs : {}), [contextKey]: context }
      return h(provideContext(node.tag), attrs, node.children)
    } else if (isElementNode(node))
      return h(node.tag, node.attrs, node.children.map(decorateTemplate(context)))
    else return node
  } else return node.map(decorateTemplate(context))
}

const defaultContextProvider = state => state

export const withContext = (provider = defaultContextProvider) => {
  const normalizedProvider = (state, actions) => {
    const context = provider(state, actions)
    if (typeof context !== 'object')
      throw new Error("Context must be an object derived from view's state and actions")

    return context
  }

  return compose(
    withHooks({
      create: original => (mount, state, actions) => {
        original()
        if (!(contextKey in state)) {
          const context = new Context(normalizedProvider(state, actions))
          state[contextKey] = context
        } else {
          const context = state[contextKey]
          context.update(normalizedProvider(state, actions))
        }
      },
      update: original => (mount, state, actions) => {
        original()

        const context = state[contextKey]
        context.update(normalizedProvider(state, actions))
      }
    }),
    provideContext
  )
}

const updateKey = Symbol('update')
const subscriptionKey = Symbol('subscription')
const defaultContextGetter = context => ({ context })

export const getContext = (getter = defaultContextGetter) =>
  compose(
    withHooks({
      create: original => (mount, state, actions) => {
        let context = state[contextKey]
        if (context != null)
          Object.assign(state, getter(context.value))

        original()

        // becaue previous hook could be 'withContext'
        if (context == null)
          context = state[contextKey]

        if (context != null) {
          state[subscriptionKey] = context.subscribe(actions[updateKey])
          Object.assign(state, getter(context.value))
        }
      },

      destroy: original => (mount, state, actions) => {
        if (subscriptionKey in state)
          state[subscriptionKey]()

        original()
      }
    }),
    withActions({
      [updateKey]: value => () => ({ ...getter(value) })
    })
  )
