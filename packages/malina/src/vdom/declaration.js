import { compose } from 'malina-util'
import { genGlobalUniqId } from '../env'
import { Node } from './node'

const TEMPLATE_MEMO_DEPTH = 4 // memoization depth in the node tree
const TEMPLATE_MEMO_TRIES = 6

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

  let timesChanged = 0
  let prev = null
  return (...args) => {
    const next = fn(...args)
    if (prev === next)
      return next

    if (timesChanged > TEMPLATE_MEMO_TRIES)
      return next

    const prevNode = Node.isNode(prev)
    const nextNode = Node.isNode(next)
    if (prevNode && nextNode) {
      const node = getReplacedNode(prev, next, [])
      if (node !== prev) timesChanged += 1
      else timesChanged -= 1
      prev = node
      return node
    } else if (nextNode) {
      timesChanged += 1
      prev = next
      return next
    } else {
      timesChanged += 1
      prev = null
      return next
    }
  }
}

const optimizeTemplate = fn => {
  const memoized = memoizedTemplate(fn)
  let constant
  let prev
  return facade => {
    if (constant)
      return prev

    const node = memoized(facade)
    if (constant === undefined) {
      constant = facade.constant
      prev = node
    }

    return node
  }
}

export const createTemplate = arg => {
  if (arg instanceof Function) return optimizeTemplate(arg)
  else return () => arg
}

// immutable
export class Declaration {
  constructor(template, behavior, actions) {
    this.template = template instanceof Function ? template : () => template
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

/**
 * Check if the given object is VDOM Node with view declaration
 *
 * @method
 * @param {*} node object to check
 * @returns {boolean} true if node is VDOM Node with view declaration, false if not
 */
export const isViewNode = node =>
  Node.isNode(node) && Declaration.isViewDeclaration(node.tag)

/**
 * Check if the given object is VDOM Node with HTML element
 *
 * @method
 * @param {*} node object to check
 * @returns {boolean} true if node is VDOM Node with HTML element, false if not
 */
export const isElementNode = node => Node.isNode(node) && !Declaration.isViewDeclaration(node.tag)

/**
 * Check if the given object is VDOM Node with text
 *
 * @method
 * @param {*} node object to check
 * @returns {boolean} true if node is VDOM Node with text, false if not
 */
export const isTextNode = node => !(node instanceof Object) && typeof node !== 'object'

/**
 * Declare view composed from a list of decorators
 *
 * @method
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
 * @method
 * @param {Function|Node|string|null} arg vdom node or a function that returns vdom node
 * @returns {Declaration} view declaration
 */
export const template = arg => new Declaration(arg)
