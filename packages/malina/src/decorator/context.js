import { keys } from 'malina-util'
import { withBehavior } from './base'

const defaultContextProvider = ({ state }) => state

const normalizeContextProvider = arg => {
  if (arg === defaultContextProvider)
    return arg

  let provider = () => null
  if (arg instanceof Function) provider = arg
  else provider = () => arg

  return view => {
    const context = provider(view)
    const typeOfContext = typeof context
    if (typeOfContext !== 'object')
      throw new Error(`Context must be an object, got ${typeOfContext}`)

    return context
  }
}

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
 * @method
 * @param {Object|Function} provider context provider as a function of view
 *                            or context object
 * @returns {Function} view decorator
 */
export const withContext = (provider = defaultContextProvider) => {
  const normalizedProvider = normalizeContextProvider(provider)

  return withBehavior(facade => {
    facade.view.initializeContext(normalizedProvider)
  })
}

const defaultContextConsumer = context => ({ context })

const createPropContextConsumer = names => context => {
  const value = {}
  for (const key of names)
    value[key] = context[key]

  return value
}

const createObjectContextConsumer = object => context => {
  const value = {}
  for (const key of keys(object))
    value[object[key]] = context[key]

  return value
}

const normalizeContextConsumer = args => {
  if (args.length === 0) return defaultContextConsumer
  else if (args.length === 1) {
    const arg = args[0]
    if (arg instanceof Function) return arg
    else if (typeof arg === 'string') return createPropContextConsumer(arg)
    else return createObjectContextConsumer(arg)
  } else return createPropContextConsumer(...args)
}

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
 * @method
 * @param  {...any} args getter or string or mapping
 * @returns {Function} view decorator
 */
export const getContext = (...args) => {
  const normalizedConsumer = normalizeContextConsumer(args)

  return withBehavior(facade => {
    facade.view.subscribeContext(normalizedConsumer)
  })
}
