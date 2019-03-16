import { compose, genRandomId } from 'malina-util'

export default class Declaration {
  constructor(template, behavior, actions) {
    this.template = template
    this.behavior = behavior || (() => {})
    this.actions = actions || {}
    this.id = genRandomId(8)
    this.originalId = null
  }

  static isViewDeclaration(obj) {
    return typeof obj === 'object' && obj !== null &&
      obj.isViewDeclaration instanceof Function && obj.isViewDeclaration()
  }

  isViewDeclaration() {
    return true // because instanceof can be inreliable on some build configurations
  }

  decorate(...fns) {
    return compose(...fns)(this)
  }
}
