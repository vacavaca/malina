import { shallowEqual, keys, compose } from 'malina-util'
import { h, isElementNode, isViewNode, isTextNode } from './node'
import { view } from './declaration'
import { toOnEventName, normalizeEventName } from './event'
import { defaultContext } from './context'
import { isDevelopment } from './env'

const isParametrizedAction = value =>
  Array.isArray(value) && value.length === 2 && value[0] instanceof Function

const isSameParametrizedAction = (a, b) =>
  isParametrizedAction(a) && isParametrizedAction(b) &&
  a[0] === b[0] && a[1] === b[1]

const isRoot = path => path.length === 0

const isSameViewNode = (a, b) => a.tag.id === b.tag.id

const requireKeysSet = node => {
  const { children } = node
  if (!children.every((node, i) =>
    i === 0 ||
    !isViewNode(node) ||
    !isViewNode(children[i - 1]) ||
    node.attrs.key ||
    !isSameViewNode(node, children[i - 1])
  ))
    throw new Error("Every view node in an array must have a 'key' attribute")
  return node
}

const requireUniqueKeys = node => {
  const { children } = node
  let index = {}
  for (const node of children) {
    if (isViewNode(node) && node.attrs.key) {
      if (!(node.tag.id in index))
        index[node.tag.id] = {}

      if (node.attrs.key in index[node.tag.id])
        throw new Error("Every view node in an array must have an unique 'key' attribute")

      index[node.tag.id][node.attrs.key] = true
    }
  }
  return node
}

const requireNoInnerHtmlOverlap = node => {
  const { attrs, children } = node
  if ('innerHtml' in attrs && attrs.innerHtml != null && children != null && children.length > 0)
    throw new Error('Nodes with "innerHtml" attribute must not have children')

  return node
}

const requireValidChildren = compose(
  requireKeysSet,
  requireUniqueKeys,
  requireNoInnerHtmlOverlap
)

class ViewInt {
  constructor(node, context) {
    const { tag: declaration, attrs: state, children } = node
    const initialState = declaration.state instanceof Function
      ? { ...state, ...(declaration.state(state) || {}) }
      : { ...(declaration.state || {}), ...state }
    const declaredActions = declaration.actions instanceof Function
      ? declaration.actions(state)
      : declaration.actions
    const declaredHooks = declaration.hooks instanceof Function
      ? declaration.hooks(state)
      : declaration.hooks

    this.template = declaration.template
    this.state = initialState
    this.actions = this.bindActions(declaredActions || {})
    this.children = children
    this.hooks = declaredHooks || {}

    this.context = context.setMounting(false)
    this.templateLock = false
    this.updateLock = false
    this.element = null
    this.node = null
    this.innerViews = new Map()
    this.parametrizedEventListeners = new Map()
    this.scheduledActions = []
    this.mounted = false
    this.destroyed = false
    this.trackedActionUpdate = false
    this.callHook('create')
  }

  static instantiate(node, context) {
    if (!isViewNode(node))
      throw new Error('View can only be instantiated from view-nodes')
    return new View(node, context)
  }

  mount(container, index) {
    const document = container.ownerDocument
    if (this.destroyed)
      return

    let top = false
    if (!this.context.store.mountLock) {
      // no need to copy context here
      this.context.store.mountLock = true
      top = true
    }

    const next = this.renderTemplate()
    if (Array.isArray(next))
      throw new Error('View can only have one root element')

    if (isElementNode(next)) {
      const element = this.mountNodeElement(container, index, next, [], this.context)
      this.element = element
    } else if (isViewNode(next)) {
      const view = this.instantiateInnerView(next, [], this.context)
      view.mount(container, index)
      this.element = view.element
    } else if (isTextNode(next)) {
      const element = document.createTextNode(`${next != null ? next : ''}`)
      this.element = element
      const before = container.childNodes[index] || null
      container.insertBefore(element, before)
    } else throw new Error('Invalid template type')

    this.node = next
    this.mounted = true
    for (const [action, args] of this.scheduledActions)
      this.callAction(action, ...args)
    this.scheduledActions = []

    if (top) {
      const queue = this.context.store.mountHookQueue
      this.context.store.mountHookQueue = []
      this.context.store.mountLock = false

      for (const hook of queue)
        hook()

      this.callHook('mount')
    } else
      this.context.store.mountHookQueue.push(() => this.callHook('mount'))
  }

  move(container, index) {
    const before = container.childNodes[index] || null
    container.insertBefore(this.element, before)
    this.container = container
    this.index = index
  }

  update(state = null, children = null) {
    if (this.destroyed)
      throw new Error('View has been destroyed')

    const nextState = this.updateState(state)
    const nextChildren = this.updateChildrenState(children)

    const update = this.state !== nextState || this.children !== nextChildren

    this.state = nextState
    this.children = nextChildren

    if (this.mounted && update) {
      this.refresh()
      this.callHook('update')
    }

    return update
  }

  refresh() {
    const next = this.renderTemplate()
    const prev = this.node
    this.node = next
    this.patch(this.element, prev, next, [], this.context)
  }

  unmount(removeElement) {
    this.mounted = false
    if (isElementNode(this.node))
      this.destroyInnerViews(this.node, [])
    else if (isViewNode(this.node))
      this.destroyInnerView([])

    if (removeElement)
      this.element.remove()

    this.callHook('unmount')
    this.element = null
  }

  destroy(removeElement = true) {
    this.unmount(removeElement)
    this.callHook('destroy')
    this.destroyed = true
  }

  /** @private */
  static getPathKey(path) {
    return path.join('.')
  }

  /** @private */
  static getAttrKey(path, name) {
    return `${name}.${View.getPathKey(path)}`
  }

  /** @private */
  renderTemplate() {
    this.templateLock = true
    try {
      let next = this.template(this.state, this.actions, this.children)
      if (Array.isArray(next)) {
        if (next.length !== 1)
          throw new Error('Only one root element must be rendered for a view')

        next = next[0]
      }

      next = next != null ? next : ''
      return next
    } finally {
      this.templateLock = false
    }
  }

  /** @private */
  bindActions(actions) {
    const bound = {}
    for (const key of keys(actions)) {
      const action = actions[key]
      if (action instanceof Function)
        bound[key] = (...args) => this.callAction(actions[key], ...args)
      else bound[key] = this.bindActions(action)
    }

    return bound
  }

  /** @private */
  callAction(action, ...args) {
    if (this.templateLock)
      throw new Error("Actions can't be called while rendering view template")

    const update = !this.updateLock
    this.updateLock = true
    let result = action(...args)
    if (result instanceof Function)
      result = result(this.state, this.actions)
    else if (result instanceof Promise) {
      return (async () => {
        this.finishAction(update)
        result = await result
        if (result instanceof Function)
          result = result(this.state, this.actions)

        if (result instanceof Promise) {
          this.finishAction(update)
          result = await result
          this.finishAction(update, result)
          return this.state
        } else {
          this.finishAction(update, result)
          return this.state
        }
      })()
    }

    if (result instanceof Promise) {
      return (async () => {
        this.finishAction(update)
        result = await result
        this.finishAction(update, result)
        return this.state
      })()
    } else {
      this.finishAction(update, result)
      return this.state
    }
  }

  /** @private */
  finishAction(update, result = null) {
    this.updateLock = false
    if (update) {
      if (!this.destroyed && this.mounted) {
        const updated = this.update(result)
        if (!updated && this.trackedActionUpdate) {
          this.trackedActionUpdate = false
          this.refresh()
          this.callHook('update')
        } else
          this.trackedActionUpdate = false
      } else if (!this.destroyed)
        this.state = this.updateState(result)
    } else {
      const nextState = this.updateState(result)
      this.trackedActionUpdate = this.trackedActionUpdate || this.state !== nextState
      this.state = nextState
    }
  }

  /** @private */
  updateState(update = null) {
    if (update == null || update === this.state)
      return this.state

    const nextState = update !== null ? { ...this.state, ...update } : this.state
    return !shallowEqual(this.state, nextState) ? nextState : this.state
  }

  /** @private */
  updateChildrenState(children = null) {
    if (children === null || children === null)
      return this.children

    const selfEmpty = this.children == null || this.children.length === 0
    const nextEmpty = children.length === 0

    if (selfEmpty !== nextEmpty)
      return children
    else return !shallowEqual(this.children, children) ? children : this.children
  }

  /** @private */
  callHook(hook) {
    if (hook in this.hooks)
      this.hooks[hook](this.element, this.state, this.actions)
  }

  /** @private */
  patch(element, prev, next, path, context) {
    if (prev === next)
      return

    if (isElementNode(prev)) {
      if (next == null) this.patchFromNodeToNone(element, prev, path)
      else if (isElementNode(next)) this.patchFromNodeToNode(element, prev, next, path, context)
      else if (isViewNode(next)) this.patchFromNodeToView(element, prev, next, path, context)
      else if (isTextNode(next)) this.patchFromNodeToText(element, prev, next, path)
      else throw new Error('Invalid template type')
    } else if (isViewNode(prev)) {
      if (next == null) this.patchFromViewToNone(element, prev, path)
      else if (isElementNode(next)) this.patchFromViewToNode(element, prev, next, path, context)
      else if (isViewNode(next)) this.patchFromViewToView(element, prev, next, path, context)
      else if (isTextNode(next)) this.patchFromViewToText(element, prev, next, path)
      else throw new Error('Invalid template type')
    } else {
      if (next == null) this.patchFromTextToNone(element, path)
      else if (isElementNode(next)) this.patchFromTextToNode(element, next, path, context)
      else if (isViewNode(next)) this.patchFromTextToView(element, next, path, context)
      else if (isTextNode(next)) this.patchTextNodes(element, prev, next, path)
      else throw new Error('Invalid template type')
    }
  }

  /** @private */
  patchFromTextToNone(element, path) {
    if (isRoot(path))
      throw new Error('Root element deleted during patch')

    element.parentNode.removeChild(element)
  }

  /** @private */
  patchTextNodes(element, prev, next, path) {
    if (prev !== next) {
      const newElement = element.ownerDocument.createTextNode(`${next}`)
      element.replaceWith(newElement)

      if (isRoot(path))
        this.element = newElement
    }
  }

  /** @private */
  patchFromTextToNode(element, next, path, context) {
    const newElement = this.createNodeElement(element.ownerDocument, next, path, context)
    element.replaceWith(newElement)
    if (isRoot(path))
      this.element = newElement
  }

  /** @private */
  patchFromTextToView(element, next, path, context) {
    const view = this.instantiateInnerView(next, path, context)
    const index = Array.from(element.parentNode.childNodes).findIndex(n => n === element)
    const parent = element.parentNode
    element.remove()
    view.mount(parent, index)

    if (isRoot(path))
      this.element = view.element
  }

  /** @private */
  patchFromNodeToNone(element, prev, path) {
    if (isRoot(path))
      throw new Error('Root element deleted during patch')

    this.removeParametrizedListeners(prev, path)
    this.destroyInnerViews(prev, path)
    element.remove()
  }

  /** @private */
  patchFromNodeToText(element, prev, next, path) {
    this.removeParametrizedListeners(prev, path)
    this.destroyInnerViews(prev, path)
    const newElement = element.ownerDocument.createTextNode(`${next}`)
    element.replaceWith(newElement)
    if (isRoot(path))
      this.element = newElement
  }

  /** @private */
  patchFromNodeToNode(element, prev, next, path, context) {
    if (prev === next)
      return

    if (prev.tag === next.tag) {
      this.updateAttributes(element, prev, next, path, context)
      this.updateChildren(element, prev, next, path, context)
    } else {
      this.removeParametrizedListeners(prev, path)
      this.destroyInnerViews(prev, path)
      const newElement = this.createNodeElement(element.ownerDocument, next, path, context)
      element.replaceWith(newElement)

      if (isRoot(path))
        this.element = newElement
    }
  }

  /** @private */
  patchFromNodeToView(element, prev, next, path, context) {
    this.removeParametrizedListeners(prev, path)
    this.destroyInnerViews(prev, path)
    const view = this.instantiateInnerView(next, path, context)
    const index = Array.from(element.parentNode.childNodes).findIndex(n => n === element)
    const parent = element.parentNode
    element.remove()
    view.mount(parent, index)
    if (isRoot(path))
      this.element = view.element
  }

  /** @private */
  patchFromViewToNone(element, prev, path) {
    if (isRoot(path))
      throw new Error('Root element deleted during patch')
    this.destroyInnerView(path)
    element.remove()
  }

  /** @private */
  patchFromViewToText(element, prev, next, path) {
    this.destroyInnerView(path)
    const newElement = element.ownerDocument.createTextNode(`${next}`)
    element.replaceWith(newElement)

    if (isRoot(path))
      this.element = newElement
  }

  /** @private */
  patchFromViewToNode(element, prev, next, path, context) {
    this.destroyInnerView(path)
    const newElement = this.createNodeElement(element.ownerDocument, next, path, context)
    element.replaceWith(newElement)

    if (isRoot(path))
      this.element = newElement
  }

  /** @private */
  patchFromViewToView(element, prev, next, path, context) {
    if (prev === next)
      return

    if (isSameViewNode(prev, next) && prev.attrs.key === next.attrs.key) {
      const view = this.getInstantiatedView(path)
      view.update(next.attrs, next.children)
    } else {
      this.destroyInnerView(path)
      const view = this.instantiateInnerView(next, path, context)
      const index = Array.from(element.parentNode.childNodes).findIndex(n => n === element)
      const parent = element.parentNode
      element.remove()
      view.mount(parent, index)

      if (isRoot(path))
        this.element = view.element
    }
  }

  /** @private */
  unmountPatch() {
    this.mounted = false
    this.callHook('unmount')
    this.element = null
  }

  /** @private */
  destroyInnerViews(node, path) {
    for (const ndx in node.children) {
      const nextPath = path.concat([ndx])
      const child = node.children[ndx]
      if (isViewNode(child))
        this.destroyInnerView(nextPath)
      else if (isElementNode(child))
        this.destroyInnerViews(child, nextPath)
    }
  }

  /** @private */
  destroyInnerView(path) {
    const view = this.getInstantiatedView(path)
    view.destroy(false)
    this.removeInstantiatedView(path)
  }

  /** @private */
  createNodeElement(document, node, path, context) {
    let element
    context = context
      .setSvg(context.svg || node.tag === 'svg')
    if (context.svg) element = document.createElementNS('http://www.w3.org/2000/svg', node.tag)
    else element = document.createElement(node.tag)

    this.refreshAttributes(element, node, path, context)
    this.refreshChildren(element, node, path, context)
    return element
  }

  /** @private */
  mountNodeElement(container, index, node, path, context) {
    const document = container.ownerDocument
    let element
    context = context
      .setSvg(context.svg || node.tag === 'svg')
      .setMounting(true)

    if (context.svg) element = document.createElementNS('http://www.w3.org/2000/svg', node.tag)
    else element = document.createElement(node.tag)

    this.refreshAttributes(element, node, path, context)
    const before = container.childNodes[index] || null
    container.insertBefore(element, before)
    this.refreshChildren(element, node, path, context)
    return element
  }

  /** @private */
  refreshAttributes(element, node, path, context) {
    for (const name in node.attrs) {
      if (name === 'innerHtml')
        continue

      const value = node.attrs[name]
      this.addAttribute(element, name, value, path, context)
    }
  }

  /** @private */
  updateAttributes(element, prev, next, path, context) {
    if (prev === next)
      return

    for (const name in next.attrs) {
      if (name === 'innerHtml')
        continue

      const nextValue = next.attrs[name]
      if (name in prev.attrs) {
        const prevValue = prev.attrs[name]
        this.updateAttribute(element, name, prevValue, nextValue, path, context)
      } else this.addAttribute(element, name, nextValue, path, context)
    }

    for (const name in prev.attrs) {
      if (name === 'innerHtml')
        continue

      if (!(name in next.attrs))
        this.removeAttribute(element, name, prev.attrs[name], path, context)
    }
  }

  /** @private */
  addAttribute(element, name, value, path, context) {
    if (name === 'style') {
      for (const prop in value)
        this.setStyleProp(element, prop, value[prop] || '')
    } else if (value instanceof Function)
      this.addEventListener(element, normalizeEventName(name), value)
    else if (isParametrizedAction(value)) {
      const listener = this.createParametrizedListener(value[0], value[1], path, name)
      const event = normalizeEventName(name)
      this.addEventListener(element, event, listener)
    } else if (name === 'data' && value != null && typeof value === 'object') {
      for (const key in value)
        element.dataset[key] = value[key]
    } else if (name !== 'focus' && name in element && !context.svg && value != null)
      element[name] = value
    else if (typeof value === 'boolean') {
      if (name === 'focus' && element.focus && element.blur) {
        if (value) element.focus()
        else element.blur()
      } else element.setAttribute(name, name)
    } else if (value != null) element.setAttribute(name, value)
  }

  /** @private */
  updateAttribute(element, name, prev, next, path, context) {
    if (prev === next)
      return

    if (isSameParametrizedAction(prev, next))
      return

    if (name === 'style') {
      for (const prop in prev) {
        if (!(prop in next))
          this.removeStyleProp(element, prop)
      }

      for (const prop in next) {
        const style = next[prop] || ''
        this.setStyleProp(element, prop, style)
      }
    } else if (next instanceof Function) {
      this.removeAttribute(element, name, prev, path)
      this.addAttribute(element, name, next, path)
    } else if (isParametrizedAction(next)) {
      this.removeAttribute(element, name, prev, path)
      this.addAttribute(element, name, next, path)
    } else if (name === 'data') {
      const prevObject = prev != null && typeof prev === 'object'
      const nextObject = next != null && typeof next === 'object'
      if (prevObject && nextObject) {
        for (const key in prev) {
          if (!(key in next))
            delete element.dataset[key]
        }

        for (const key in next)
          element.dataset[key] = next[key]
      } else if (prevObject && !nextObject) {
        for (const key in element.dataset)
          delete element.dataset[key]
      } else if (!prevObject && nextObject) {
        for (const key in next)
          element.dataset[key] = next[key]
      }
    } else if (name !== 'focus' && name in element && !context.svg)
      element[name] = next
    else if (typeof prev === 'boolean') {
      if (name === 'focus') {
        if (element.focus && element.blur) {
          if (next) element.focus()
          else element.blur()
        }
      } else {
        if (next) element.setAttribute(name, name)
        else element.removeAttribute(name)
      }
    } else {
      if (next != null) element.setAttribute(name, next)
      else if (prev != null) element.removeAttribute(name)
    }
  }

  /** @private */
  removeAttribute(element, name, prev, path, context) {
    if (name === 'style') element.style.cssText = ''
    else if (prev instanceof Function) {
      const event = normalizeEventName(name)
      this.removeEventListener(element, event, prev)
    } else if (isParametrizedAction(prev)) {
      const listener = this.getParametrizedListener(path, name)
      const event = normalizeEventName(name)
      this.removeEventListener(element, event, listener)
    } else if (name === 'data' && prev != null && typeof prev === 'object') {
      for (const key in element.dataset)
        delete element.dataset[key]
    } else if (name !== 'focus' && name in element && !context.svg)
      element[name] = undefined
    else if (typeof prev === 'boolean') {
      if (name === 'focus' && element.blur)
        element.blur()
      else element.removeAttribute(name)
    } else if (prev != null) element.removeAttribute(name)
  }

  /** @private */
  setStyleProp(element, prop, style) {
    if (prop[0] === '-') {
      const importantNdx = style.indexOf('!important')
      let clearedStyle = style
      if (importantNdx !== -1)
        clearedStyle = importantNdx !== style.slice(0, importantNdx) + style.slice(importantNdx + 10)

      clearedStyle = clearedStyle.trim().replace(/;$/, '')
      element.style.setProperty(prop, clearedStyle)
    } else element.style[prop] = style
  }

  /** @private */
  removeStyleProp(element, prop) {
    if (prop[0] === '-') element.style.removeProperty(prop)
    else
      delete element.style[prop]
  }

  /** @private */
  addEventListener(element, event, listener) {
    if (element.addEventListener)
      element.addEventListener(event, listener)
    else if (element.attachEvent)
      element.attachEvent(toOnEventName(event), listener)
    else {
      const listeners = (element[event] && element[event].listeners) || []

      if (element[event] != null)
        element[event].listeners = listeners.concat(listener)
      else {
        const handler = (...args) =>
          element[event].listeners.map(f => f(...args))
        handler.listeners = listeners.concat(listener)
        element[event] = handler
      }
    }
  }

  /** @private */
  removeEventListener(element, event, listener) {
    if (element.removeEventListener)
      element.removeEventListener(event, listener)
    else if (element.detachEvent)
      element.detachEvent(toOnEventName(event), listener)
    else {
      if (element[event] != null && element[event].listeners != null)
        element[event].listeners = element[event].listener.filter(l => l !== listener)
    }
  }

  /** @private */
  refreshChildren(element, node, path, context) {
    if (!requireValidChildren(node))
      throw new Error("Every view node in an array must have an unique 'key' attribute")

    if ('innerHtml' in node.attrs)
      element.innerHTML = node.attrs.innerHtml
    else {
      for (const ndx in node.children) {
        const child = node.children[ndx]
        const nextPath = path.concat([ndx])
        this.addChildren(element, child, ndx, nextPath, context)
      }
    }
  }

  /** @private */
  addChildren(element, child, ndx = null, path, context) {
    if (isElementNode(child)) {
      if (context.mounting) this.mountNodeElement(element, ndx, child, path, context)
      else {
        const childElement = this.createNodeElement(element.ownerDocument, child, path, context)
        element.appendChild(childElement)
      }
    } else if (isViewNode(child)) {
      const view = this.instantiateInnerView(child, path, context)
      view.mount(element, ndx)
    } else if (child != null) {
      const childElement = element.ownerDocument.createTextNode(`${child}`)
      element.appendChild(childElement)
    }
  }

  /** @private */
  updateChildren(element, prev, next, path, context) {
    if (prev === next)
      return

    if (!requireValidChildren(next))
      throw new Error("Every view node in an array must have an unique 'key' attribute")

    if ('innerHtml' in next.attrs)
      element.innerHTML = next.attrs.innerHtml
    else {
      context = context
        .setSvg(context.svg || next.tag === 'svg')

      const len = Math.max(prev.children.length, next.children.length)
      let nodeIndexShift = 0
      for (let ndx = 0; ndx < len; ndx++) {
        const childNode = element.childNodes[ndx - nodeIndexShift]
        const prevChild = prev.children[ndx]
        const nextChild = ndx in next.children ? next.children[ndx] : null
        const nextPath = path.concat([ndx])
        if (prevChild != null) {
          this.patch(childNode, prevChild, nextChild, nextPath, context)
          if (nextChild == null)
            nodeIndexShift += 1
        } else {
          this.addChildren(element, nextChild, ndx, nextPath, context)
          nodeIndexShift -= 1
        }
      }
    }
  }

  /** @private */
  instantiateInnerView(node, path, context) {
    const key = View.getPathKey(path)
    const view = View.instantiate(node, context)
    this.innerViews.set(key, { view, path: path.slice() })
    return view
  }

  /** @private */
  getInstantiatedView(path) {
    const key = View.getPathKey(path)
    const entry = this.innerViews.get(key)
    return entry != null ? entry.view : null
  }

  /** @private */
  removeInstantiatedView(path) {
    const key = View.getPathKey(path)
    this.innerViews.delete(key)
  }

  /** @private */
  getParametrizedListener(path, name) {
    const key = View.getAttrKey(path, name)
    return this.parametrizedEventListeners.get(key)
  }

  /** @private */
  hasParametrizedListener(path, name) {
    const key = View.getAttrKey(path, name)
    return this.parametrizedEventListeners.has(key)
  }

  /** @private */
  createParametrizedListener(action, params, path, name) {
    const listener = (...args) => action(...params, ...args)
    const key = View.getAttrKey(path, name)
    this.parametrizedEventListeners.set(key, listener)
    return listener
  }

  /** @private */
  removeParametrizedListeners(node, path) {
    for (const name in node.attrs) {
      if (this.hasParametrizedListener(path, name))
        this.removeParametrizedListener(path, name)
    }

    for (const ndx in node.children) {
      const nextPath = path.concat([ndx])
      const child = node.children[ndx]
      if (isElementNode(child))
        this.removeParametrizedListeners(child, nextPath)
    }
  }

  /** @private */
  removeParametrizedListener(path, name) {
    const key = View.getAttrKey(path, name)
    this.parametrizedEventListeners.delete(key)
  }
}

if (isDevelopment) {
  let catchLock = false
  for (const method of Object.getOwnPropertyNames(ViewInt.prototype)) {
    if (ViewInt.prototype[method] instanceof Function) {
      const buff = ViewInt.prototype[method]
      ViewInt.prototype[method] = function (...args) {
        const catchError = !catchLock
        catchLock = true
        try {
          return buff.apply(this, args)
        } catch (error) {
          if (catchError) {
            if (this.node != null)
              error.message = `${error.message}\n\tThis error has occurred in view:\n${this.node}`
          }
          throw error
        } finally {
          if (catchError)
            catchLock = false
        }
      }
    }
  }
}

export const View = ViewInt

export const mount = (container, node, index = 0, {
  insideSvg = false
} = {}) => {
  let viewNode = node
  if (isElementNode(node))
    viewNode = h(view(node))

  const store = {
    mountLock: false,
    mountHookQueue: []
  }

  let context = defaultContext({ store })
    .setSvg(insideSvg)

  if (!context.svg) {
    const global = container.ownerDocument.defaultView
    context = context.setSvg(container instanceof global.SVGElement)
  }

  const instance = View.instantiate(viewNode, context)
  instance.mount(container, index)
  return instance
}
