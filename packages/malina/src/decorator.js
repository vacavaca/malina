import { h } from './node'
import { ViewDeclaration, view } from './declaration'

export const decorator = fn => Inner => {
  let innerView
  if (ViewDeclaration.isViewDeclaration(Inner)) innerView = Inner
  else if (typeof Inner === 'string') innerView = view((state, _, children) => h(Inner, state, children))
  else innerView = view(Inner)

  const decorated = fn(innerView)
  if (ViewDeclaration.isViewDeclaration(decorated)) return decorated
  else return view(decorated)
}
