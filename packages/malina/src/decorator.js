import { h } from './node'
import { ViewDeclaration, view } from './declaration'

export const decorator = fn => Inner => {
  let innerView
  if (ViewDeclaration.isViewDeclaration(Inner)) innerView = Inner
  else if (typeof Inner === 'string') innerView = view((state, _, children) => h(Inner, state, children))
  else innerView = view(Inner)

  let decorated = fn(innerView)
  if (!ViewDeclaration.isViewDeclaration(decorated))
    decorated = view(decorated)

  if (innerView.originalId != null)
    decorated.originalId = innerView.originalId
  else
    decorated.originalId = innerView.id
  return decorated
}
