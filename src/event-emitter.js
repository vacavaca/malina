export default class EventEmitter {
  constructor() {
    this.listenerCounter = 0
    this.listeners = {}
  }

  subscribe(listener) {
    const id = ++this.listenerCounter
    this.listeners[id] = listener
    return () => delete this.listeners[id]
  }

  notify(...args) {
    for (const id in this.listeners)
      this.listeners[id](...args)
  }
}
