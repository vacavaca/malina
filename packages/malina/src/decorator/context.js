import { withBehavior } from './base'

const defaultContextProvider = state => state

export const withContext = (provider = defaultContextProvider) => {
  const normalizedProvider = view => {
    const context = provider instanceof Function ? provider(view) : provider
    const typeOfContext = typeof context
    if (typeOfContext !== 'object')
      throw new Error(`Context must be an object, got ${typeOfContext}`)

    return context
  }

  return withBehavior(facade => {
    facade.view.initializeContext(normalizedProvider)
  })
}

const defaultContextConsumer = context => ({ context })

export const getContext = (...args) => {
  const normalizedConsumer = ctx => {
    if (args.length === 0) return defaultContextConsumer(ctx)
    else if (args.length === 1) {
      const arg = args[0]
      return arg instanceof Function ? arg(ctx) : { [arg]: ctx[arg] }
    } else {
      const value = {}
      for (const key of args)
        value[key] = ctx[key]

      return value
    }
  }

  return withBehavior(facade => {
    facade.view.subscribeContext(normalizedConsumer)
  })
}
