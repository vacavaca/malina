import { keys, compose } from 'malina-util'
import { Declaration, template, h } from '../vdom'
import decorator from './decorator'

const id = a => a

const createInitializer = value => state => {
  if (value instanceof Function) return value(state) || {}
  else return value || {}
}

/**
 * Add new behavior handlers to view
 *
 * @example
 * view(
 *   withBehavior(async view => {
 *     console.log('view created')
 *
 *     await view.mount()
 *     console.log('view mounted')
 *
 *     while (await view.updating()) {
 *       console.log('view updated')
 *     }
 *
 *     console.log('view unmounted')
 *  })
 * )
 *
 * @param  {...Function} handlers handlers
 * @returns {Function} view decorator
 */
export const withBehavior = (...handlers) => decorator(Inner =>
  new Declaration(Inner.template, view => {
    if (Inner.behavior instanceof Function)
      Inner.behavior(view)

    for (const handler of handlers)
      handler(view)
  }, Inner.actions))

/**
 * Add default state tot ivew
 *
 * @example
 * view(
 *   withState({ foo: 'bar' })
 * )
 *
 * @example
 * view(
 *   withState(props => ({
 *     foo: props.foo === 42 ? 'bar' : null
 *   }))
 * )
 *
 * @param {Object} state state object to add
 * @returns {Function} view decorator
 */
export const withState = state => withBehavior(
  view => {
    view.state = { ...createInitializer(state)(view.state), ...view.state }
  }
)

/**
 * Add actions to view
 *
 * @example
 * view(
 *   withActions({
 *     increment: (n = 1) => ({ state: { counter }}) => ({ counter: counter + n }),
 *     reset: (n = 0) => ({ counter: n }),
 *     resetAndIncrement: (resetTo = 0, incrementBy = 1) => ({ actions }) => {
 *       actions.reset(resetTo)
 *       actions.increment(incrementBy)
 *     }
 *  })
 * )
 *
 * @param {Object} actions object with actions
 * @returns {Function}
 */
export const withActions = actions => decorator(Inner =>
  new Declaration(Inner.template, Inner.behavior, {
    ...(Inner.actions || {}),
    ...(actions || {})
  }))

/**
 * Add initial state and actions to view
 *
 * @example
 * view(
 *   withStateActions(
 *     { counter: 0 },
 *     {
 *       increment: (n = 1) => ({ state: { counter }}) => ({ counter: counter + n }),
 *       decrement: (n = 1) => ({ state: { counter }}) => ({ counter: counter - n }),
 *       reset: (n = 0) => ({ counter: n }),
 *     }
 *   )
 * )
 *
 * @param {Object} state state object
 * @param {Object} actions actions object
 * @returns {Function} view decorator
 */
export const withStateActions = (state, actions) => compose(
  withState(state),
  withActions(actions)
)

/**
 * Add lifecycle handlers to view
 *
 * @example
 * view(
 *   withLifecycle({
 *     mount: view => {
 *       console.log('view mounted', view)
 *     },
 *     update: view => {
 *       console.log('view updated', view)
 *     },
 *     unmount: view => {
 *       console.log('view unmounted', view)
 *     },
 *     destroy: view => {
 *       console.log('view destroyed', view)
 *     }
 *   })
 * )
 *
 * @param {Object} handlers object with handlers
 * @returns {Function} view decorator
 */
export const withLifecycle = handlers => withBehavior(view => {
  if ('create' in handlers)
    handlers.create(view)

  if ('mount' in handlers)
    view.onMount(handlers.mount)

  if ('update' in handlers)
    view.onUpdate(handlers.update)

  if ('unmount' in handlers)
    view.onUnmount(handlers.unmount)

  if ('destroy' in handlers)
    view.onDestroy(handlers.destroy)
})

/**
 * Add template to view
 *
 * @example
 * view(
 *   withTemplate(({ state, actions }) =>
 *     <div>
 *       <p>Counter: {state.counter}</p>
 *       <button onClick={actions.increment}>Increment</button>
 *     </div>
 *   )
 * )
 *
 * @param {*} template template function or object
 * @returns {Function} view decorator
 */
export const withTemplate = template => decorator(Inner =>
  new Declaration(template, Inner.behavior, Inner.actions))

/**
 * Create new template based on the original using mapper function
 *
 * @example
 * view(
 *   mapTemplate(original => view =>
 *     <div class="wrapper">{original()}</div>
 *   )
 * )
 *
 * @param {Function} mapper mapper function, it will be given the
 *                          original template function as an argument
 * @returns {Function} view decorator
 */
export const mapTemplate = mapper => decorator(Inner =>
  new Declaration(view => {
    const original = () => {
      return Inner.template(view)
    }

    return mapper(original)(view)
  }, Inner.behavior, Inner.actions))

/**
 * Map state using mapper function
 *
 * @example
 * view(
 *   mapState(({ open }) => ({ closed: !open }))
 * )
 *
 * @param {Function} mapper mapper function
 * @returns {Function} view decorator
 */
export const mapState = (mapper = id) => decorator(Inner =>
  template(({ state, children }) => h(Inner, mapper(state), children))
)

/**
 * Rename state properties
 *
 * @example
 * view(
 *   renameState({ oldProp: 'newProp' })
 * )
 *
 * @param {Object} nameMap mapping between old and new property names
 * @returns {Function} view decorator
 */
export const renameState = (nameMap = {}) => mapState(state => {
  const renamed = {}
  for (const key of keys(nameMap)) {
    if (key in state)
      renamed[nameMap[key]] = state[key]
  }

  return renamed
})
