import { compose } from 'malina-util'
import { genGlobalUniqId } from '../env'
import { Node } from './node'

const TEMPLATE_MEMO_DEPTH = 3 // memoization depth in the node tree

const getReplacedNode = (prev, next, path) => {
  if (path.length >= TEMPLATE_MEMO_DEPTH)
    return next

  const prevNode = Node.isNode(prev)
  if (prevNode !== Node.isNode(next))
    return next

  if (!prevNode)
    return next

  const prevView = isViewNode(prev)
  const nextView = isViewNode(next)

  if (prevView && nextView) {
    if (prev.isEqual(next)) return prev
  } else if (prevView === nextView) {
    const len = prev.children.length
    if (prev.isEqual(next, false) && len === next.children.length) {
      for (let i = 0; i < len; i++) {
        const nextPath = path.concat([i])
        const prevChild = prev.children[i]
        const nextChild = next.children[i]

        const replacedChild = getReplacedNode(prevChild, nextChild, nextPath)
        if (replacedChild !== prevChild)
          return next
      }

      return prev
    }
  }

  return next
}

const memoizedTemplate = fn => {
  if (TEMPLATE_MEMO_DEPTH === 0)
    return fn

  let prev = null
  return (...args) => {
    const next = fn(...args)
    if (prev === next)
      return next

    const prevNode = Node.isNode(prev)
    const nextNode = Node.isNode(next)
    if (prevNode && nextNode) {
      const node = getReplacedNode(prev, next, [])
      prev = node
      return node
    } else if (nextNode) {
      prev = next
      return next
    } else {
      prev = null
      return next
    }
  }
}

const createTemplate = arg => {
  if (arg instanceof Function) return memoizedTemplate(arg)
  else return createTemplate(() => arg)
}

// immutable
export class Declaration {
  constructor(template, behavior, actions) {
    this.template = createTemplate(template)
    this.behavior = behavior || (() => { })
    this.actions = actions || {}
    this.id = genGlobalUniqId('declaration', 8)
    this.originalId = null
    this.isDevOnly = false
    this.decorators = {}
  }

  static isViewDeclaration(obj) {
    return typeof obj === 'object' && obj !== null &&
      obj.isViewDeclaration instanceof Function && obj.isViewDeclaration()
  }

  isViewDeclaration() {
    return true // because instanceof can be inreliable on some build configurations
  }

  setDevelopmentOnly(value) {
    const next = this.copy()
    next.isDevOnly = value
    return next
  }

  is(declaration) {
    return this === declaration || this.id === declaration.id || this.originalId === declaration.originalId
  }

  decorateWith(decoratorKey) {
    const next = this.copy()
    next.decorators = { ...this.decorators, [decoratorKey]: true }
    return next
  }

  /** @private */
  copy() {
    const next = new Declaration(null)
    next.template = this.template
    next.behavior = this.behavior
    next.actions = { ...this.actions }
    next.id = this.id
    next.originalId = this.originalId
    next.isDevOnly = this.isDevOnly
    next.decorators = { ...this.decorators }
    return next
  }
}

export const isViewNode = node =>
  Node.isNode(node) && Declaration.isViewDeclaration(node.tag)

export const isElementNode = node => Node.isNode(node) && !Declaration.isViewDeclaration(node.tag)

export const isTextNode = node => !(node instanceof Object) && typeof node !== 'object'

/**
 * Declare view composed from a list of decorators
 *
 * @param  {...any} args decorators or one vdom node
 * @returns {Declaration} view declaration
 */
export const view = (...args) => {
  if (args.length > 1) return compose(...args)(new Declaration(null))
  else if (args.length === 1) {
    const arg = args[0]
    if (arg instanceof Function) return arg(new Declaration(null))
    else return new Declaration(arg)
  } else return new Declaration(null)
}

/**
 * Declare a simple view that only renders some template
 * using it's state and children
 *
 * @param {Function|Node|string|null} arg vdom node or a function that returns vdom node
 * @returns {Declaration} view declaration
 */
export const template = arg => new Declaration(arg)
