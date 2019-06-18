import { h, isViewNode, isElementNode } from 'malina'
import { compose, shallowEqual } from 'malina-util'
import { memoizedDecorator } from './memoized'
import { withLifecycle, mapTemplate } from './common'
import EventEmitter from './event-emitter'

const contextKey = Symbol.for('__malina_context')

class Context {
  constructor(value = {}) {
    this.value = value
    this.emitter = new EventEmitter()
  }

  subscribe(listener) {
    return this.emitter.subscribe(listener)
  }

  update(value, silent = false) {
    const next = { ...this.value, ...value }
    if (shallowEqual(this.value, next))
      return

    this.value = next
    if (!silent)
      this.emitter.notify(this.value)
  }

  get() {
    return this.value
  }
}

const provideContext = memoizedDecorator(mapTemplate(original =>
  ({ state }) => {
    const context = state[contextKey]
    const node = original()
    if (context != null) return decorateTemplate(context)(node)
    else return node
  }), true)

const decorateTemplate = context => node => {
  if (!Array.isArray(node)) {
    if (isViewNode(node)) {
      const attrs = { [contextKey]: context, ...(node.attrs != null ? node.attrs : {}) }
      return h(provideContext(node.tag), attrs, node.children.map(decorateTemplate(context)))
    } else if (isElementNode(node))
      return h(node.tag, node.attrs, node.children.map(decorateTemplate(context)))
    else if (node instanceof Function)
      return (...args) => decorateTemplate(context)(node(...args))
    else return node
  } else return node.map(decorateTemplate(context))
}

const defaultContextProvider = state => state

export const withContext = (provider = defaultContextProvider) => {
  const normalizedProvider = state => {
    const context = provider(state)
    const typeOfContext = typeof context
    if (typeOfContext !== 'object')
      throw new Error(`Context must be an object, got ${typeOfContext}`)

    return context
  }

  return compose(
    provideContext,
    withLifecycle({
      create: view => {
        if (!(contextKey in view.state)) {
          const context = new Context(normalizedProvider(view))
          view.state[contextKey] = context
        } else {
          const context = view.state[contextKey]
          context.update(normalizedProvider(view))
        }
      },
      update: view => {
        const context = view.state[contextKey]
        context.update(normalizedProvider(view))
      }
    })
  )
}

const subscriptionKey = Symbol.for('__malina_context_subscription')
const defaultContextGetter = context => ({ context })

export const getContext = (getter = defaultContextGetter) =>
  compose(
    withLifecycle({
      create: view => {
        let context = view.state[contextKey]

        if (context != null) {
          view.state = { ...view.state, ...(getter(context.value) || {}) }
          view.state[subscriptionKey] = context.subscribe(value => {
            view.update({ ...getter(value) })
          })
        }
      },

      update: view => {
        let context = view.state[contextKey]

        if (context != null)
          view.state = { ...view.state, ...(getter(context.value) || {}) }
      },

      destroy: ({ state }) => {
        if (subscriptionKey in state)
          state[subscriptionKey]()
      }
    })
  )
