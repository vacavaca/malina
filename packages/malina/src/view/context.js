export default class Context {
  constructor(docuement, store, globalStore) {
    this.document = docuement
    this.store = store
    this.globalStore = globalStore
  }

  static initialize(document, store) {
    return new Context(document, store, {})
  }

  isLocked() {
    return this.getOrCreate('lock', false, true)
  }

  lock() {
    return this.update('lock', true, true)
  }

  unlock() {
    return this.update('lock', false, true)
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
    const store = { }
    for (const key in this.store) {
      if (Object.prototype.hasOwnProperty.call(this.store, key))
        store[key] = this.store[key]
    }

    store['updating'] = updating

    return new Context(this.document, store, this.globalStore)
  }

  getDocument() {
    return this.document
  }

  update(key, value, useGlobal = false) {
    const store = useGlobal ? this.globalStore : this.store
    store[key] = value
    return this
  }

  copy(update) {
    return new Context(this.document, { ...this.store, ...update }, this.globalStore)
  }

  getOrCreate(key, defval, useGlobal = false) {
    const store = useGlobal ? this.globalStore : this.store
    if (key in store) return store[key]
    else {
      store[key] = defval
      return store[key]
    }
  }
}
