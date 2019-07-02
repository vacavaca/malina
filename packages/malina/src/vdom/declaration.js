import { Random } from 'malina-util'
import { getGlobal } from '../env'
import { Node } from './node'

const global_ = getGlobal()
const randomKey = Symbol.for('__malina.declaration.random')

let random
if (global_ != null && randomKey in global_) random = global_[randomKey]
else {
  random = { generator: new Random('malina.view-id-seed'), counter: 9 }
  if (global_ != null)
    global_[randomKey] = random
}

const TEMPLATE_MEMO_DEPTH = 4 // memoization depth in the node tree

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

export class Declaration {
  constructor(template, behavior, actions) {
    this.template = createTemplate(template)
    this.behavior = behavior || (() => { })
    this.actions = actions || {}
    this.id = `${random.generator.id(8)}${++random.counter}`
    this.originalId = null
    this.isDevOnly = false
  }

  static isViewDeclaration(obj) {
    return typeof obj === 'object' && obj !== null &&
      obj.isViewDeclaration instanceof Function && obj.isViewDeclaration()
  }

  isViewDeclaration() {
    return true // because instanceof can be inreliable on some build configurations
  }

  setDevelopmentOnly(value) {
    this.isDevOnly = value
    return this
  }

  is(declaration) {
    return this === declaration || this.id === declaration.id || this.originalId === declaration.originalId
  }
}

export const isViewNode = node =>
  Node.isNode(node) && Declaration.isViewDeclaration(node.tag)

export const isElementNode = node => Node.isNode(node) && !Declaration.isViewDeclaration(node.tag)

export const isTextNode = node => !(node instanceof Object) && typeof node !== 'object'
