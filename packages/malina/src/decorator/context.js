import { withBehavior } from './base'

const defaultContextProvider = state => state

/**
 * Add values from view state to context
 *
 * @example
 * view(withContext({ api }))
 *
 * @example
 * view(
 *   withContext({ state: { todos }, actions }) => ({ todos, actions }) // available globaly
 * )
 *
 * @param {Function} provider context provider as a function of view
 *                            returns object
 * @returns {Function} view decorator
 */
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

/**
 * Get values from context to view state
 *
 * @example
 * // state.todos now contains global state with todos
 * view(
 *   getContext(({ todos }) => ({ todos }))
 * )
 *
 * @example
 * // same as ({ todos }) => ({ todos })
 * view(getContext("todos"))
 *
 * @example
 * // same as ({ todos }) => ({ todosContext: todos })
 * view(getContet({ todos: 'todosContext' }))
 *
 * @param  {...any} args getter or string or mapping
 * @returns {Function} view decorator
 */
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
