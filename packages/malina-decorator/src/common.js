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
        const originalHook = () => {
          if (original[key] != null)
            original[key](mount, state, actions)
        }
        decorate[key](originalHook)(mount, state, actions)
      }
    }

    return result
  }

  return view(Inner.template, Inner.state, Inner.actions, next)
})

export const withTemplate = getTemplate => decorator(Inner =>
  view(getTemplate(Inner.template), Inner.state, Inner.actions, Inner.hooks))

export const mapState = mapper => decorator(Inner =>
  (state, actions, children) => h(Inner, mapper(state), children))
