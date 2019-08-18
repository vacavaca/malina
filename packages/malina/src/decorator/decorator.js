import { Declaration, Node, h } from '../vdom'
import { genGlobalUniqId } from '../env'

const isValidToWrapView = value =>
  value === null ||
  Node.isNode(value) ||
  (typeof value !== 'object' && Object.getPrototypeOf(value) === Function.prototype)

const updateDecoratorsHistory = (key, next) =>
  Declaration.isViewDeclaration(next) && next.decorateWith(key)

export default fn => {
  const key = genGlobalUniqId('decorator', 8)

  return Inner => {
    let innerView
    if (Declaration.isViewDeclaration(Inner)) innerView = Inner
    else if (typeof Inner === 'string') innerView = new Declaration(({ state, children }) => h(Inner, state, children))
    else if (isValidToWrapView(Inner)) innerView = new Declaration(Inner)
    else throw new Error('Nothing to decorate')

    if (innerView.decorators[key])
      return innerView

    let decorated = fn(innerView)
    if (!Declaration.isViewDeclaration(decorated)) {
      if (isValidToWrapView(decorated))
        decorated = new Declaration(decorated)
      else return updateDecoratorsHistory(key, decorated)
    }

    if (innerView.originalId != null)
      decorated.originalId = innerView.originalId
    else
      decorated.originalId = innerView.id

    return updateDecoratorsHistory(key, decorated)
  }
}
