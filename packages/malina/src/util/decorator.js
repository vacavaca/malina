import { Declaration, h } from '../vdom'
import { view } from '../view'

export default fn => Inner => {
  let innerView
  if (Declaration.isViewDeclaration(Inner)) innerView = Inner
  else if (typeof Inner === 'string') innerView = view(({ state, children }) => h(Inner, state, children))
  else innerView = view(Inner)

  let decorated = fn(innerView)
  if (!Declaration.isViewDeclaration(decorated))
    decorated = view(decorated)

  if (innerView.originalId != null)
    decorated.originalId = innerView.originalId
  else
    decorated.originalId = innerView.id
  return decorated
}
