export default class Context {
  constructor(docuement, store, globalStore) {
    this.document = docuement
    this.store = { ...store }
    this.globalStore = globalStore
  }

  static initialize(document, store) {
    return new Context(document, store, {})
  }

  isLocked() {
    return this.getOrCreate('lock', false)
  }

  lock() {
    return this.update('lock', true)
  }

  unlock() {
    return this.update('lock', false)
  }

  getCallbackQueue(key) {
    return this.getOrCreate(`callback-queue.${key}`, [], true)
  }

  setSvg(value) {
    return this.copyWith({ svg: value })
  }

  isSvg() {
    return this.getOrCreate('svg', false)
  }

  setInProduction(value) {
    return this.update('production', value)
  }

  isInProduction() {
    return this.getOrCreate('production', true)
  }

  isUpdating() {
    return this.getOrCreate('updating', false)
  }

  setUpdating(updating) {
    return this.update('updating', updating)
  }

  getDocument() {
    return this.document
  }

  update(key, value) {
    this.store[key] = value
    return this
  }

  copy(update) {
    return new Context(this.document, { ...this.store, ...update }, this.globalStore)
  }

  getOrCreate(key, defval, global = false) {
    const store = global ? this.globalStore : this.store
    if (key in store) return store[key]
    else {
      store[key] = defval
      return store[key]
    }
  }
}
