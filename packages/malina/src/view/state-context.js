import { keys, shallowEqual } from 'malina-util'
import { Dispatcher } from '../concurrent'

export default class StateContext {
  constructor(value = {}) {
    this.value = value
    this.dispatcher = new Dispatcher()
  }

  subscribe(listener) {
    return this.dispatcher.on('update', listener)
  }

  update(value, silent = false) {
    if (value == null)
      return

    if (keys(value).length === 0)
      return

    const next = { ...this.value, ...value }
    if (shallowEqual(this.value, next))
      return

    this.value = next
    if (!silent)
      this.dispatcher.notify('update', [this.value])
  }

  get() {
    return this.value
  }
}
