import { h, view } from '../ui/index'
import { ViewDeclaration } from '../ui/declaration'
import { Node } from '../ui/node'

import { View } from '../ui/view'

export const decorator = fn => Inner => {
  let innerView;
  if (Inner instanceof ViewDeclaration) innerView = Inner
  else if (typeof Inner === 'string') innerView = view((state, _, children) => h(Inner, state, children))
  else innerView = view(Inner)

  const decorated = fn(innerView)
  if (decorated instanceof ViewDeclaration) return decorated
  else return view(decorated)
}


export const withState = state => decorator(Inner => {
  const originalState = passed => {
    if (Inner.state instanceof Function) return Inner.state(passed)
    else return Inner.state
  }

  const decoratedState = passed => {
    if (state instanceof Function) return state(passed)
    else return state
  }

  const next = passed => {
    const declared = originalState(passed)
    const decorated = decoratedState(passed)
    return {
      ...(declared != null ? declared : {}),
      ...(decorated != null ? decorated : {})
    }
  }

  return view(Inner.template, next, Inner.actions, Inner.hooks)
})


export const withActions = actions => decorator(Inner => {
  const originalActions = state => {
    if (Inner.actions instanceof Function) return Inner.actions(state)
    else return Inner.actions
  }

  const next = state => ({
    ...(originalActions(state) || {}),
    ...(actions || {})
  })

  return view(Inner.template, Inner.state, next, Inner.hooks)
})


export const withHooks = hooks => decorator(Inner => {
  const originalHooks = state => {
    if (Inner.hooks instanceof Function) return Inner.hooks(state)
    else return Inner.hooks
  }

  const next = state => {
    const original = originalHooks(state) || {}

    const result = { ...original }
    for (const key in hooks)
      result[key] = (mount, state, actions) => {
        const originalHook = () => {
          if (original[key] != null)
            original[key](mount, state, actions)
        }
        hooks[key](originalHook)(mount, state, actions)
      }

    return result
  }

  return view(Inner.template, Inner.state, Inner.actions, next)
})


export const withTemplate = getTemplate => decorator(Inner =>
  view(getTemplate(Inner.template), Inner.state, Inner.actions, Inner.hooks))


export const mapState = mapper => decorator(Inner =>
  (state, actions, children) => h(Inner, mapper(state), children))
