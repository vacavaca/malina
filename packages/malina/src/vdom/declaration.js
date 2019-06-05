import { compose, Random } from 'malina-util'
import { getGlobal } from '../env'

const global_ = getGlobal()
const randomKey = Symbol.for('__malina.declaration.random')

let random
if (global_ != null && randomKey in global_) random = global_[randomKey]
else {
  random = new Random('malina.view-id-seed')
  if (global_ != null)
    global_[randomKey] = random
}

export default class Declaration {
  constructor(template, behavior, actions) {
    this.template = template
    this.behavior = behavior || (() => { })
    this.actions = actions || {}
    this.id = random.id(8)
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

  decorate(...fns) {
    return compose(...fns)(this)
  }

  is(declaration) {
    return this === declaration || this.id === declaration.id || this.originalId === declaration.originalId
  }
}
