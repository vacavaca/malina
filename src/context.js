import { h, decorator, view, ViewNode, ElementNode } from './ui'
import EventEmitter from './event-emitter'
import { shallowEqual } from './util'

const decorated = new Map()
const providers = new Set()

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
    if (shallowEqual(this.value, value))
      return

    this.value = { ...this.value, ...value }
    this.emitter.notify(value)
  }

  get() {
    return this.value
  }
}


const provideContext = decorator(Inner =>
  (state, actions, children) => {
    const context = state[contextKey]
    const node = Inner.template(state, actions, children)
    if (context != null) return decorateTemplate(context)(node)
    else return node
  })


const decorateTemplate = context => node => {
  if (node instanceof ViewNode) {
    if (providers.has(node))
      return h(node.declaration, state, node.children.map(decorateTemplate(context)))

    if (!decorated.has(node.declaration))
      decorated.set(node.declaration, provideContext(node.declaration))
    const view = decorated.get(node.declaration)
    const state = { ...(node.state != null ? node.state : {}), [contextKey]: context }
    return h(view, state, node.children.map(decorateTemplate(context)))
  } else if (node instanceof ElementNode) {
    return h(node.tag, node.attrs, node.children.map(decorateTemplate(context)))
  } else return node
}


const defaultContextProvider = state => state

export const withContext = (provider = defaultContextProvider) =>
  decorator(Inner => {
    const normalizedProvider = state => {
      const context = provider(state)
      if (typeof context !== 'object')
        throw new Error("Context must be object derived from view's state")

      return context
    }

    providers.add(Inner.declaration)

    const originalHooks = state => {
      if (Inner.hooks instanceof Function) return Inner.hooks(state)
      else return Inner.hooks
    }

    const hooks = state => {
      const original = originalHooks(state)

      const create = (element, state, actions) => {
        if (original.create != null)
          original.create(element, state, actions)

        if (!(contextKey in state)) {
          const context = new Context(provider(state))
          state[contextKey] = context
        }
      }

      const update = (element, state, actions) => {
        if (original.update != null)
          original.update(element, state, actions)

        const context = state[contextKey]
        context.update(provider(state))
      }

      return { ...original, create, update }
    }

    return view((state, actions, children) => {
      const context = state[contextKey]
      const node = Inner.template(state, actions, children)
      return decorateTemplate(context)(node)
    }, Inner.state, Inner.actions, hooks)
  })


const updateKey = Symbol('update')
const subscriptionKey = Symbol('subscription')
const defaultContextGetter = context => ({ context })

export const getContext = (getter = null) =>
  decorator(Inner => {
    const originalActions = state => {
      if (Inner.actions instanceof Function) return Inner.actions(state)
      else return Inner.actions
    }

    const update = value => state => ({ ...getter(value) })

    const actions = state => ({
      ...originalActions(state),
      [updateKey]: update
    })

    const originalHooks = state => {
      if (Inner.hooks instanceof Function) return Inner.hooks(state)
      else return Inner.hooks
    }

    const hooks = state => {
      const original = originalHooks(state)

      const create = (element, state, actions) => {
        const context = state[contextKey]
        if (context != null) {
          state[subscriptionKey] = context.subscribe(actions[updateKey])
          Object.assign(state, getter(context.value))
        }

        if (original.create != null)
          original.create(state)
      }

      const destroy = (element, state, actions) => {
        const unsubscribe = state[subscriptionKey]
        if (unsubscribe != null)
          unsubscribe()

        if (original.destroy != null)
          original.destroy(element, state, actions)
      }

      return {
        ...original,
        create,
        destroy
      }
    }

    return view(Inner.template, Inner.state, actions, hooks)
  })