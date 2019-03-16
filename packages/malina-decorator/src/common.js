import { view, decorator } from 'malina'

const createInitializer = value => state => {
  if (value instanceof Function) return value(state) || {}
  else return value || {}
}

export const withBehavior = (...handlers) => decorator(Inner =>
  view(Inner.template, view => {
    for (const handler of handlers)
      handler(view)

    if (Inner.behavior instanceof Function)
      Inner.behavior(view)
  }, Inner.actions))

export const withState = state => withBehavior(
  view => {
    view.state = { ...createInitializer(state)(view.state), ...view.state }
  }
)

export const withActions = actions => decorator(Inner =>
  view(Inner.template, Inner.behavior, {
    ...(Inner.actions || {}),
    ...(actions || {})
  }))

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

export const withTemplate = getTemplate => decorator(Inner =>
  view(view => {
    const original = () => {
      return Inner.template(view)
    }

    return getTemplate(original)(view)
  }, Inner.behavior, Inner.actions))
