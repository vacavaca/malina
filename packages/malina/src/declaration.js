import { genRandomId } from './id'

class Declaration {
  constructor(template, state, actions, hooks) {
    this.template = template
    this.state = state
    this.actions = actions
    this.hooks = hooks
    this.id = genRandomId(8)
  }

  static isViewDeclaration(obj) {
    return typeof obj === 'object' && obj !== null &&
      obj.isViewDeclaration instanceof Function && obj.isViewDeclaration()
  }

  isViewDeclaration() {
    return true // because instanceof can be inreliable on some build configurations
  }
}

export const view = (template, state = null, actions = null, hooks = null) =>
  new Declaration(template instanceof Function ? template : () => template, state, actions, hooks)

export const ViewDeclaration = Declaration
