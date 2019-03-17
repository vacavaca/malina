export default class Context {
  constructor(options, store) {
    this.options = options
    this.store = {}
  }

  update(options) {
    return new Context({ ...this.options }, this.store)
  }
}

export const defaultContext = options => new Context(options)
