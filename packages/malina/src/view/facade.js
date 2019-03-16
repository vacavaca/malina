export class InnerFacade {
  constructor(view) {
    this.view = view
  }

  get state() {
    return this.view.state
  }

  set state(val) {
    this.view.state = val
  }

  get actions() {
    return this.view.actions
  }

  get children() {
    return this.view.children
  }

  get isMounted() {
    return this.view.mounted
  }

  get isDestroyed() {
    return this.view.destroyed
  }

  get element() {
    return this.view.element
  }
}

export class ConcurrentFacade extends InnerFacade {
  update(updater) {
    if (!this.isDestroyed) return this.view.update(updater)
    else return this.state
  }

  mount() {
    return this.view.dispatcher.wait('mount', true)
  }

  onMount(handler) {
    return this.view.dispatcher.on('mount', () => handler(this))
  }

  nextUpdate() {
    return this.view.dispatcher.wait('update')
  }

  onUpdate(handler) {
    return this.view.dispatcher.on('update', () => handler(this))
  }

  unmount() {
    return this.view.dispatcher.wait('unmount')
  }

  onUnmount(handler) {
    return this.view.dispatcher.on('unmount', () => handler(this))
  }

  destroy() {
    return this.view.dispatcher.wait('destroy')
  }

  onDestroy(handler) {
    return this.view.dispatcher.on('destroy', () => handler(this))
  }

  async waitFor(arg, unwrap) {
    if (arg(this.state))
      return true

    while (await this.updating()) {
      if (arg(this.state))
        return true
    }

    if (arg(this.state))
      return true

    return false
  }

  async updating() {
    return Promise.race([
      this.nextUpdate().then(() => true),
      this.unmount().then(() => false)
    ])
  }

  setTimeout(fn, timeout) {
    const id = setTimeout(fn, timeout)
    this.onDestroy(() => clearTimeout(id))
  }

  setInterval(fn, interval) {
    const id = setInterval(fn, interval)
    this.onDestroy(() => clearInterval(id))
  }
}

export class OuterFacade extends InnerFacade {
  mount(...args) {
    // delegating
    return this.view.mount(...args)
  }

  update(updater) {
    if (!this.isDestroyed) return this.view.update(updater)
    else return this.state
  }

  onMount(handler) {
    return this.view.dispatcher.on('mount', () => handler(this))
  }

  onUpdate(handler) {
    return this.view.dispatcher.on('update', () => handler(this))
  }

  onUnmount(handler) {
    return this.view.dispatcher.on('unmount', () => handler(this))
  }

  onDestroy(handler) {
    return this.view.dispatcher.on('destroy', () => handler(this))
  }
}
