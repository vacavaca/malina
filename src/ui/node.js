import { ViewDeclaration } from './declaration'

export class Node {
  constructor(tag, attrs = {}, children = []) {
    if (tag == null)
      throw new Error("JSX tag empty ")

    this.tag = tag
    this.attrs = attrs
    this.children = children
  }

  toString() {
    const tagName = typeof this.tag === 'stirng' ? this.tag : 'View'
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


export const isViewNode = node => node instanceof Node && node.tag instanceof ViewDeclaration


export const isElementNode = node => node instanceof Node && !isViewNode(node)


export const isTextNode = node => typeof node === 'string'


export const h = (tag, attrs, ...children) => {
  const childrenArray = children.length === 1 && Array.isArray(children[0]) ? children[0] : children
  return new Node(tag, attrs, childrenArray)
}
