import { flatten, shallowEqual } from 'malina-util'

/**
 * Virtual DOM Node
 */
export class Node {
  constructor(tag, attrs = {}, children = []) {
    if (tag == null)
      throw new Error('Node tag cannot be empty')

    this.tag = tag
    this.attrs = attrs || {}
    this.children = flatten(children)
    this.isDevOnly = typeof tag === 'object' && tag.isDevOnly
  }

  /**
   * Checks if the given object is VDOM Node or not
   *
   * @param {*} obj object to check
   * @returns {boolean} true if object is node, false if not
   */
  static isNode(obj) {
    return typeof obj === 'object' && obj !== null &&
      obj.isNode instanceof Function && obj.isNode()
  }

  /**
   * Check if given objects are equal as nodes
   *
   * @param {*} a first object
   * @param {*} b second object
   * @param {boolean|undefined} compareChildren compare node children or not (default true)
   * @returns {boolean} true if nodes are equal, false if not
   */
  static isEqualNodes(a, b, compareChildren = true) {
    const isNode = Node.isNode(a)
    if (isNode !== Node.isNode(b))
      return false

    if (isNode) return a.isEqual(b)
    else return a === b
  }

  /**
   * Returns true
   * @returns {boolean}
   */
  isNode() {
    return true // because instanceof can be inreliable on some build configurations
  }

  /**
   * Check if the current node is for development only
   *
   * @returns {boolean}
   */
  isDevOnly() {
    return this.isDevOnly
  }

  /**
   * Check if the current node is equal to some other node
   * a.isEqual(b) is equivalent to Node.isEqual(a, b)
   *
   * @param {*} other other object to compare with
   * @param {boolean|undefined} compareChildren compare node children or not (default true)
   * @returns {boolean} true is nodes are equal, false otherwise
   */
  isEqual(other, compareChildren = true) {
    if (this === other)
      return true

    if (this.tag !== other.tag)
      return false

    if (this.isDevOnly !== other.isDevOnly)
      return false

    if (!shallowEqual(this.attrs, other.attrs))
      return false

    if (compareChildren) {
      if (this.children === other.children)
        return true

      const len = this.children.length
      if (len !== other.children.length)
        return false

      for (let i = 0; i < len; i++) {
        if (!Node.isEqualNodes(this.children[i], other.children[i]))
          return false
      }
    }

    return true
  }

  /**
   * Used only for debugging purposes
   */
  toString() {
    const attrString = Object.keys(this.attrs).reduce((a, k) => {
      const value = this.attrs[k]
      if (typeof value === 'string') return `${a} ${k}="${value}"`
      else if (value instanceof Function) return `${a} ${k}=[Function]`
      else return `${a} ${k}={${typeof value !== 'object' ? JSON.stringify(value) : '{...}'}}`
    }, '')

    const tagName = typeof this.tag === 'string' ? this.tag : '[View]'

    if (this.children.length > 0) {
      return `<${tagName}${attrString}>\n${
        this.children.map(child => {
          if (child == null)
            return '\t""'
          const str = child.toString()
          return str.split('\n').map(s => `\t${s}`).join('\n')
        }).join('\n')
      }\n</${tagName}>`
    } else return `<${tagName}${attrString}/>`
  }
}

/**
 * VDOM Node constructor for JSX
 *
 * @function
 * @param {*} tag node tag
 * @param {*} attrs node attributs
 * @param  {...any} children node childen
 */
export const h = (tag, attrs, ...children) => {
  const childrenArray = children.length === 1 && Array.isArray(children[0]) ? children[0] : children
  return new Node(tag, attrs, childrenArray)
}
