import { flatten } from 'malina-util'
import { ViewDeclaration } from './declaration'

export class Node {
  constructor(tag, attrs = {}, children = []) {
    if (tag == null)
      throw new Error('Node tag cannot be empty')

    this.tag = tag
    this.attrs = attrs || {}
    this.children = flatten(children)
  }

  static isNode(obj) {
    return typeof obj === 'object' && obj !== null &&
      obj.isNode instanceof Function && obj.isNode()
  }

  isNode() {
    return true // because instanceof can be inreliable on some build configurations
  }

  /**
   * Used only for debugging purposes
   */
  toString() {
    const attrString = Object.keys(this.attrs).reduce((a, k) => {
      const value = this.attrs[k]
      if (typeof value === 'string') return `${a} ${k}="${value}"`
      else if (value instanceof Function) return `${a} ${k}=[Function]`
      else return `${a} ${k}={${JSON.stringify(value)}}`
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

export const isViewNode = node =>
  Node.isNode(node) && ViewDeclaration.isViewDeclaration(node.tag)

export const isElementNode = node => Node.isNode(node) && !ViewDeclaration.isViewDeclaration(node.tag)

export const isTextNode = node => !(node instanceof Object) && typeof node !== 'object'

export const h = (tag, attrs, ...children) => {
  const childrenArray = children.length === 1 && Array.isArray(children[0]) ? children[0] : children
  return new Node(tag, attrs, childrenArray)
}
