import { keys, compose } from 'malina-util'
import { Declaration, template, h } from '../vdom'
import decorator from './decorator'

const id = a => a

const createInitializer = value => state => {
  if (value instanceof Function) return value(state) || {}
  else return value || {}
}

export const withBehavior = (...handlers) => decorator(Inner =>
  new Declaration(Inner.template, view => {
    if (Inner.behavior instanceof Function)
      Inner.behavior(view)

    for (const handler of handlers)
      handler(view)
  }, Inner.actions))

export const withState = state => withBehavior(
  view => {
    view.state = { ...createInitializer(state)(view.state), ...view.state }
  }
)

export const withActions = actions => decorator(Inner =>
  new Declaration(Inner.template, Inner.behavior, {
    ...(Inner.actions || {}),
    ...(actions || {})
  }))

export const withStateActions = (state, actions) => compose(
  withState(state),
  withActions(actions)
)

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

export const withTemplate = template => decorator(Inner =>
  new Declaration(template, Inner.behavior, Inner.actions))

export const mapTemplate = getTemplate => decorator(Inner =>
  new Declaration(view => {
    const original = () => {
      return Inner.template(view)
    }

    return getTemplate(original)(view)
  }, Inner.behavior, Inner.actions))

export const mapState = (mapper = id) => decorator(Inner =>
  template(({ state, children }) => h(Inner, mapper(state), children))
)

export const renameState = (nameMap = {}) => mapState(state => {
  const renamed = {}
  for (const key of keys(nameMap)) {
    if (key in state)
      renamed[nameMap[key]] = state[key]
  }

  return renamed
})
