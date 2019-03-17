import { Declaration, Node, h } from '../vdom'
import { view } from '../view'

const isValidToWrapView = value =>
  value === null ||
  Node.isNode(value) ||
  (typeof value !== 'object' && Object.getPrototypeOf(value) === Function.prototype)

export default fn => Inner => {
  let innerView
  if (Declaration.isViewDeclaration(Inner)) innerView = Inner
  else if (typeof Inner === 'string') innerView = view(({ state, children }) => h(Inner, state, children))
  else if (isValidToWrapView(Inner)) innerView = view(Inner)
  else throw new Error('Nothing to decorate')

  let decorated = fn(innerView)
  if (!Declaration.isViewDeclaration(decorated)) {
    if (isValidToWrapView(decorated))
      decorated = view(decorated)
    else return decorated
  }

  if (innerView.originalId != null)
    decorated.originalId = innerView.originalId
  else
    decorated.originalId = innerView.id
  return decorated
}
