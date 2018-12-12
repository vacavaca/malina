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

  toString() {
    const tagName = typeof this.tag === 'string' ? this.tag : 'View'
    return `${tagName} ${JSON.stringify(this.attrs || {})}${
      this.children.length > 0 ? `\n${this.children.map(c => {
        if (c == null)
          return "\t''"
        const str = c.toString()
        return str.split('\n').map(s => `\t${s}`).join('\n')
      }).join('\n')}` : ''
    }`
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
