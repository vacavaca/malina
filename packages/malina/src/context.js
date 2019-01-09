
export default class Context {
  constructor(options) {
    this.options = options
  }

  get svg() {
    return this.options.isSvg
  }

  get mounting() {
    return this.options.mounting
  }

  get store() {
    return this.options.store
  }

  setSvg(isSvg) {
    return this.update({ isSvg })
  }

  setMounting(mounting) {
    return this.update({ mounting })
  }

  update(options) {
    return new Context({ ...this.options, ...options })
  }
}

export const defaultContext = options => new Context(options)

export const svgContext = options => new Context(options)
