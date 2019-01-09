import { h, view, decorator } from 'malina'

const createInitializer = value => state => {
  if (value instanceof Function) return value(state) || {}
  else return value || {}
}

export const withState = state => decorator(Inner => {
  const originalState = createInitializer(Inner.state)
  const decorateState = createInitializer(state)

  const next = passed => {
    const declared = originalState(passed)
    const decorate = decorateState(passed)
    return { ...declared, ...decorate }
  }

  return view(Inner.template, next, Inner.actions, Inner.hooks)
})

export const withActions = actions => decorator(Inner => {
  const originalActions = createInitializer(Inner.actions)
  const decorateActions = createInitializer(actions)

  const next = state => ({
    ...originalActions(state),
    ...decorateActions(state)
  })

  return view(Inner.template, Inner.state, next, Inner.hooks)
})

export const withHooks = hooks => decorator(Inner => {
  const originalHooks = createInitializer(Inner.hooks)
  const decorateHooks = createInitializer(hooks)

  const next = state => {
    const original = originalHooks(state)
    const decorate = decorateHooks(state)

    const result = { ...original }
    for (const key in decorate) {
      result[key] = (mount, state, actions) => {
        const originalHook = (innerMount, innerState, innerActions) => {
          mount = innerMount !== undefined ? innerMount : mount
          innerState = innerState !== undefined ? innerState : state
          innerActions = innerActions !== undefined ? innerActions : actions

          if (original[key] != null)
            original[key](innerMount, innerState, innerActions)
        }
        decorate[key](originalHook)(mount, state, actions)
      }
    }

    return result
  }

  return view(Inner.template, Inner.state, Inner.actions, next)
})

export const withTemplate = getTemplate => decorator(Inner =>
  view((originalState, originalActions, originalChildren) => {
    const original = (state, actions, children) => {
      const passState = state !== undefined ? state : originalState
      const passActions = actions !== undefined ? actions : originalActions
      const passChildren = children !== undefined ? children : originalChildren
      return Inner.template(passState, passActions, passChildren)
    }

    return getTemplate(original)(originalState, originalActions, originalChildren)
  }, Inner.state, Inner.actions, Inner.hooks))

export const mapState = mapper => decorator(Inner =>
  (state, _, children) => h(Inner, mapper(state), children))
