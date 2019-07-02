import { flatten, shallowEqual } from 'malina-util'

export class Node {
  constructor(tag, attrs = {}, children = []) {
    if (tag == null)
      throw new Error('Node tag cannot be empty')

    this.tag = tag
    this.attrs = attrs || {}
    this.children = flatten(children)
    this.isDevOnly = typeof tag === 'object' && tag.isDevOnly
  }

  static isNode(obj) {
    return typeof obj === 'object' && obj !== null &&
      obj.isNode instanceof Function && obj.isNode()
  }

  static isEqualNodes(a, b, compareChildren = true) {
    const isNode = Node.isNode(a)
    if (isNode !== Node.isNode(b))
      return false

    if (isNode) return a.isEqual(b)
    else return a === b
  }

  isNode() {
    return true // because instanceof can be inreliable on some build configurations
  }

  isDevOnly() {
    return this.isDevOnly
  }

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

export const h = (tag, attrs, ...children) => {
  const childrenArray = children.length === 1 && Array.isArray(children[0]) ? children[0] : children
  return new Node(tag, attrs, childrenArray)
}
