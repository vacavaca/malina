const none = {}


const shallowEqual = (a, b) => {
  if (a === b)
    return true

  if ((a == null) !== (b == null))
    return false

  if (a == null)
    return true

  const keys = Object.keys(a)
  const len = keys.length
  if (Object.keys(b).length !== len)
    return false

  for (const key of keys)
    if (a[key] !== b[key])
      return false

  return true
}


const toOnEventName = event =>
  `on${event[0].toUpperCase()}${event.substr(1)}`


const normalizeEventName = name => {
  const lower = name.toLowerCase()
  return lower.startsWith("on") ? lower.substr(2) : lower
}


const isParametrizedAction = value =>
  Array.isArray(value) && value.length === 2 && value[0] instanceof Function


const isSameParametrizedAction = (a, b) =>
  isParametrizedAction(a) && isParametrizedAction(b) &&
  a[0] === b[0] && a[1] === b[1]


class Context {
  constructor({
    isSvg = false
  }) {
    this.isSvg = isSvg
  }
}


class ViewDeclaration {
  constructor(template, state, actions, hooks) {
    this.template = template
    this.state = state
    this.actions = actions
    this.hooks = hooks
  }
}


class ElementNode {
  constructor(tag, attrs, children) {
    this.tag = tag
    this.attrs = attrs
    this.children = children
  }

  toString() {
    return `${this.tag} ${JSON.stringify(this.attrs || {})}${
      this.children.length > 0 ? `\n${this.children.map(c => {
        if (c == null)
          return "\t''"
        const str = c.toString()
        return str.split('\n').map(s => `\t${s}`).join('\n')
      }).join('\n')}` : ''
      }`
  }
}


class ViewNode {
  constructor(declaration, state = {}, actions = {}, children = {}) {
    this.declaration = declaration
    this.state = state
    this.actions = actions
    this.children = children
  }

  instantiate(context = null) {
    return new View(this.declaration, this, context)
  }

  isSame(other) {
    return this.declaration === other.declaration
  }

  is(declaration) {
    return this.declaration === declaration
  }

  toString() {
    const v = this.instantiate()
    return `${v.template(v.state, v.actions, v.children)}`
  }
}


let mountLock = false
let mountHookQueue = []
const defaultContext = new Context({})
const svgContext = new Context({ isSvg: true })


class View {
  constructor(declaration, node, context) {
    const declaredState = declaration.state instanceof Function ? declaration.state() : declaration.state
    const declaredActions = declaration.actions instanceof Function ? declaration.actions() : declaration.actions
    const declaredHooks = declaration.hooks instanceof Function ? declaration.hooks() : declaration.hooks

    this.template = declaration.template
    this.state = { ...declaredState, ...node.state }
    this.selfActions = this.bindActions(declaredActions)
    this.actions = { ...this.selfActions, ...node.actions }
    this.children = node.children
    this.hooks = declaredHooks
    this.context = context || defaultContext

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

  mount(container, index) {
    const document = container.ownerDocument
    if (this.destroyed)
      return;

    let top = false
    if (!mountLock) {
      mountLock = true
      top = true
    }

    const next = this.template(this.state, this.actions, this.children)
    if (next instanceof ElementNode) {
      if (next.tag === 'svg')
        this.context = svgContext
      const element = this.mountNodeElement(container, index, next, [])
      this.element = element
    } else if (next instanceof ViewNode) {
      const view = this.instantiateInnerView(next, [])
      view.mount(container, index)
    } else {
      const element = document.createTextNode(`${next != null ? next : ''}`)
      this.element = element
      const before = container.childNodes[index] || null
      container.insertBefore(element, before)
    }
    this.node = next
    this.mounted = true
    for (const [action, args] of this.scheduledActions)
      this.callAction(action, ...args)
    this.scheduledActions = []

    if (top) {
      for (const hook of mountHookQueue)
        hook()

      this.callHook('mount')
      mountLock = false
    } else {
      mountHookQueue.push(() => this.callHook('mount'))
    }
  }

  update(state = none, actions = none, children = none) {
    if (this.destroyed)
      throw new Error("View has been destroyed");

    if (!this.mounted)
      throw new Error("View has been unmounted");

    const nextState = this.updateState(state)
    const nextActions = this.updateActions(actions)
    const nextChildren = this.updateChildrenState(children)

    const update = this.state !== nextState || this.actions !== nextActions || this.children !== nextChildren

    this.state = nextState
    this.actions = nextActions
    this.children = nextChildren

    if (update) {
      this.refresh()
      this.callHook('update')
    }

    return update
  }

  refresh() {
    const next = this.template(this.state, this.actions, this.children)
    const prev = this.node
    this.node = next
    this.patch(this.element, prev, next, [])
  }

  unmount(removeElement) {
    this.mounted = false
    this.destroyInnerViews(this.node, [])

    if (removeElement)
      this.element.remove()

    this.callHook('unmount')
  }

  destroy(removeElement) {
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
  bindActions(actions) {
    const bound = {}
    for (const key in actions)
      bound[key] = (...args) => this.callAction(actions[key], ...args)

    return bound
  }

  /** @private */
  callAction(action, ...args) {
    if (this.mounted) {
      const update = !this.updateLock
      this.updateLock = true
      const result = action(...args)(this.state, this.actions)
      if (result instanceof Promise) {
        this.updateLock = false
        if (this.trackedActionUpdate)
          this.refresh()
        this.trackedActionUpdate = false
        return (async () => {
          const state = await result
          if (!this.destroyed && this.mounted) {
            this.update(state)
          } else if (!this.destroyed) {
            this.state = this.updateState(state)
          }
          return this.state
        })()
      } else {
        if (update) {
          if (!this.destroyed && this.mounted) {
            const updated = this.update(result)
            if (!updated && this.trackedActionUpdate)
              this.refresh()
            this.trackedActionUpdate = false
          } else if (!this.destroyed) {
            this.state = this.updateState(result)
          }
        } else {
          const nextState = this.updateState(result)
          this.trackedActionUpdate = this.trackedActionUpdate || this.state !== nextState
          this.state = nextState
        }
        this.updateLock = false
        return this.state
      }
    } else {
      this.scheduledActions.push([action, args])
    }
  }

  /** @private */
  updateState(update = none) {
    if (update == null || update === this.state)
      return this.state

    const nextState = update !== none ? { ...this.state, ...update } : this.state
    return !shallowEqual(this.state, nextState) ? nextState : this.state
  }

  /** @private */
  updateActions(update = none) {
    if (update == null || update === this.actions)
      return this.actions

    let nextActions = update !== none ? { ...this.actions, ...update } : this.actions
    return !shallowEqual(this.actions, nextActions) ? nextActions : this.actions
  }

  /** @private */
  updateChildrenState(children = none) {
    if (children === none || children === null)
      return this.children

    const selfEmpty = this.children == null || this.children.length === 0
    const nextEmpty = children.length === 0

    if (selfEmpty !== nextEmpty) {
      return children
    } else return !shallowEqual(this.children, children) ? children : this.children
  }

  /** @private */
  callHook(hook) {
    if (hook in this.hooks)
      this.hooks[hook](this.element, this.state, this.actions)
  }

  /** @private */
  patch(element, prev, next, path) {
    if (prev === next)
      return

    if (prev instanceof ElementNode) {
      if (next == null) this.patchFromNodeToNone(element, prev, path)
      else if (next instanceof ElementNode) this.patchFromNodeToNode(element, prev, next, path)
      else if (next instanceof ViewNode) this.patchFromNodeToView(element, prev, next, patth)
      else this.patchFromNodeToText(element, prev, next, path)
    } else if (prev instanceof ViewNode) {
      if (next == null) this.patchFromViewToNone(element, prev, path)
      else if (next instanceof ElementNode) this.patchFromViewToNode(element, prev, next, path)
      else if (next instanceof ViewNode) this.patchFromViewToView(element, prev, next, path)
      else this.patchFromViewToText(element, prev, next, path)
    } else {
      if (next == null) this.patchFromTextToNone(element)
      else if (next instanceof ElementNode) this.patchFromTextToNode(element, next, path)
      else if (next instanceof ViewNode) this.patchFromTextToView(element, next, path)
      else this.patchTextNodes(element, prev, next)
    }
  }

  /** @private */
  patchFromTextToNone(element) {
    element.parentNode.removeChild(element)
  }

  /** @private */
  patchTextNodes(element, prev, next) {
    if (prev !== next)
      element.replaceWith(element.ownerDocument.createTextNode(`${next}`))
  }

  /** @private */
  patchFromTextToNode(element, next, path) {
    element.replacwWith(this.createNodeElement(element.ownerDocument, next, path))
  }

  /** @private */
  patchFromTextToView(element, next, path) {
    const view = this.instantiateInnerView(next, path)
    const index = Array.from(element.parentNode.childNodes).findIndex(n => n === element)
    const parent = element.parentNode
    element.remove()
    view.mount(parent, index)
  }

  /** @private */
  patchFromNodeToNone(element, prev, path) {
    this.removeParametrizedListeners(prev, path)
    this.destroyInnerViews(prev, path)
    element.remove()
  }

  /** @private */
  patchFromNodeToText(element, prev, next, path) {
    this.removeParametrizedListeners(prev, path)
    this.destroyInnerViews(prev, path)
    element.replaceWith(element.ownerDocument.createTextNode(`${next}`))
  }

  /** @private */
  patchFromNodeToNode(element, prev, next, path) {
    if (prev === next)
      return

    if (prev.tag === next.tag) {
      this.updateAttributes(element, prev, next, path)
      this.updateChildren(element, prev, next, path)
    } else {
      this.removeParametrizedListeners(prev, path)
      this.destroyInnerViews(prev, path)
      element.replaceWith(this.createNodeElement(element.ownerDocument, next, path))
    }
  }

  /** @private */
  patchFromNodeToView(element, prev, next, path) {
    this.removeParametrizedListeners(prev, path)
    this.destroyInnerViews(prev, path)
    const view = this.instantiateInnerView(next, path)
    const index = Array.from(element.parentNode.childNodes).findIndex(n => n === element)
    const parent = element.parentNode
    element.remove()
    view.mount(parent, index)
  }

  /** @private */
  patchFromViewToNone(element, prev, path) {
    this.destroyInnerView(path)
    element.remove()
  }

  /** @private */
  patchFromViewToText(element, prev, next, path) {
    this.destroyInnerView(path)
    element.replaceWith(element.ownerDocument.createTextNode(`${next}`))
  }

  /** @private */
  patchFromViewToNode(element, prev, next, path) {
    this.destroyInnerView(path)
    element.replaceWith(this.createNodeElement(element.ownerDocument, next, path))
  }

  /** @private */
  patchFromViewToView(element, prev, next, path) {
    if (prev === next)
      return

    if (prev.isSame(next)) {
      const view = this.getInstantiatedView(path)
      view.update(next.state, next.actions, next.children)
    } else {
      this.destroyInnerView(path)
      const view = this.instantiateInnerView(next, path)
      const index = Array.from(element.parentNode.childNodes).findIndex(n => n === element)
      const parent = element.parentNode
      element.remove()
      view.mount(parent, index)
    }
  }

  /** @private */
  destroyInnerViews(node, path) {
    for (const ndx in node.children) {
      const nextPath = path.concat([ndx])
      const child = node.children[ndx]
      if (child instanceof ViewNode) {
        this.destroyInnerView(nextPath)
      } else if (child instanceof ElementNode) {
        this.destroyInnerViews(child, nextPath)
      }
    }
  }

  /** @private */
  destroyInnerView(path) {
    const view = this.getInstantiatedView(path)
    view.destroy(false)
    this.removeInstantiatedView(path)
  }

  /** @private */
  createNodeElement(document, node, path) {
    let element
    if (this.context.isSvg) element = document.createElementNS("http://www.w3.org/2000/svg", node.tag)
    else element = document.createElement(node.tag)

    this.refreshAttributes(element, node, path)
    this.refreshChildren(element, node, path)
    return element
  }

  /** @private */
  mountNodeElement(container, index, node, path) {
    const document = container.ownerDocument
    let element
    if (this.context.isSvg) element = document.createElementNS("http://www.w3.org/2000/svg", node.tag)
    else element = document.createElement(node.tag)

    this.refreshAttributes(element, node, path)
    const before = container.childNodes[index] || null
    container.insertBefore(element, before)
    this.refreshChildren(element, node, path, true)
    return element
  }

  /** @private */
  refreshAttributes(element, node, path) {
    for (const name in node.attrs) {
      const value = node.attrs[name]
      this.addAttribute(element, name, value, path)
    }
  }

  /** @private */
  updateAttributes(element, prev, next, path) {
    if (prev === next)
      return

    for (const name in next.attrs) {
      const nextValue = next.attrs[name]
      if (name in prev.attrs) {
        const prevValue = prev.attrs[name]
        this.updateAttribute(element, name, prevValue, nextValue, path)
      } else this.addAttribute(element, name, nextValue, path)
    }

    for (const name in prev.attrs)
      if (!(name in next.attrs))
        this.removeAttribute(element, name, prev.attrs[name], path)
  }

  /** @private */
  addAttribute(element, name, value, path) {
    if (name === 'style') {
      for (const prop in value) {
        this.setStyleProp(element, prop, value[prop] || "")
      }
    } else if (value instanceof Function) {
      this.addEventListener(element, normalizeEventName(name), value)
    } else if (isParametrizedAction(value)) {
      const listener = this.createParametrizedListener(value[0], value[1], path, name)
      const event = normalizeEventName(name)
      this.addEventListener(element, event, listener)
    } else if (name === 'data' && value != null && typeof value === 'object') {
      for (const key in value)
        element.dataset[key] = value[key]
    } else if (name in element && !this.context.isSvg && value != null) element[name] = value
    else if (typeof value === 'boolean') element.setAttribute(name, name)
    else if (value != null) element.setAttribute(name, value)
  }

  /** @private */
  updateAttribute(element, name, prev, next, path) {
    if (prev === next)
      return

    if (isSameParametrizedAction(prev, next))
      return

    if (name === 'style') {
      for (const prop in prev)
        if (!(prop in next))
          this.removeStyleProp(element, prop)

      for (const prop in next) {
        const style = next[prop] || ""
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
        for (const key in prev)
          if (!(key in next))
            delete element.dataset[key]

        for (const key in next)
          element.dataset[key] = next[key]
      } else if (prevObject && !nextObject) {
        for (const key in element.dataset)
          delete element.dataset[key]
      } else if (!prevObject && nextObject) {
        for (const key in next)
          element.dataset[key] = next[key]
      }
    } else if (name in element && !this.context.isSvg) {
      element[name] = next
    } else if (typeof prev === 'boolean') {
      if (next) element.setAttribute(name, name)
      else element.removeAttribute(name)
    } else {
      if (next != null) element.setAttribute(name, next)
      else element.removeAttribute(next)
    }
  }

  /** @private */
  removeAttribute(element, name, prev, path) {
    if (name === 'style') element.style.cssText = ""
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
    } else if (name in element && !this.context.isSvg) {
      element[name] = undefined
    } else if (typeof prev === 'boolean') element.removeAttribute(name)
    else if (prev != null) element.removeAttribute(name)
  }

  /** @private */
  setStyleProp(element, prop, style) {
    if (prop[0] === "-") {
      const importantNdx = style.indexOf('!important')
      let priority = "'"
      let clearedStyle = style
      if (importantNdx !== -1) {
        priority = "important"
        clearedStyle = importantNdx !== style.slice(0, importantNdx) + style.slice(importantNdx + 10)
      }

      clearedStyle = clearedStyle.trim().replace(/;$/, '')
      element.style.setProperty(prop, clearedStyle)
    } else element.style[prop] = style
  }

  /** @private */
  removeStyleProp(element, prop) {
    if (prop[0] === "-") element.style.removeProperty(prop)
    else {
      delete element.style[prop]
    }
  }

  /** @private */
  addEventListener(element, event, listener) {
    if (element.addEventListener) {
      element.addEventListener(event, listener)
    } else if (element.attachEvent) {
      element.attachEvent(toOnEventName(event), listener)
    } else {
      const listeners = path([event, "listeners"], element) || []

      if (element[event] != null) {
        element[event].listeners = listeners.concat(listener)
      } else {
        const handler = (...args) =>
          element[event].listeners.map(f => f(...args))
        handler.listeners = listeners.concat(listener)
        element[event] = handler
      }
    }
  }

  /** @private */
  removeEventListener(element, event, listener) {
    if (element.removeEventListener) {
      element.removeEventListener(event, listener)
    } else if (element.detachEvent) {
      element.detachEvent(toOnEventName(event), listener)
    } else {
      if (element[event] != null && element[event].listeners != null) {
        element[event].listeners = element[event].listener.filter(l => l !== listener)
      }
    }
  }

  /** @private */
  refreshChildren(element, node, path, mount = false) {
    for (const ndx in node.children) {
      const child = node.children[ndx]
      const nextPath = path.concat([ndx])
      this.addChildren(element, child, ndx, nextPath, mount)
    }
  }

  /** @private */
  addChildren(element, child, ndx = null, path, mount = false) {
    if (child instanceof ElementNode) {
      if (mount) this.mountNodeElement(element, null, child, path)
      else {
        const childElement = this.createNodeElement(child, path)
        element.appendChild(childElement)
      }
    } else if (child instanceof ViewNode) {
      const view = this.instantiateInnerView(child, path)
      view.mount(element, ndx)
    } else {
      if (child != null) {
        const childElement = element.ownerDocument.createTextNode(`${child}`)
        element.appendChild(childElement)
      }
    }
  }

  /** @private */
  updateChildren(element, prev, next, path) {
    if (prev === next)
      return

    const len = Math.max(prev.children.length, next.children.length)
    let nodeIndexShift = 0
    for (let ndx = 0; ndx < len; ndx++) {
      const childNode = element.childNodes[ndx - nodeIndexShift]
      const prevChild = prev.children[ndx]
      const nextChild = ndx in next.children ? next.children[ndx] : null
      const nextPath = path.concat([ndx])
      if (prevChild != null) {
        this.patch(childNode, prevChild, nextChild, nextPath)
        if (nextChild == null)
          nodeIndexShift += 1
      } else {
        this.addChildren(element, nextChild, ndx, nextPath)
        nodeIndexShift -= 1
      }
    }
  }

  /** @private */
  instantiateInnerView(node, path) {
    const key = View.getPathKey(path)
    const view = node.instantiate(this.context)
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
    for (const name in node.attrs)
      if (this.hasParametrizedListener(path, name))
        this.removeParametrizedListener(path, name)

    for (const ndx in node.children) {
      const nextPath = path.concat([ndx])
      const child = node.children[ndx]
      if (child instanceof ElementNode)
        this.removeParametrizedListeners(child, nextPath)
    }
  }

  /** @private */
  removeParametrizedListener(path, name) {
    const key = View.getAttrKey(path, name)
    this.parametrizedEventListeners.delete(key)
  }
}


export const h = (tag, attrs, ...children) => {
  const childrenArray = children.length === 1 && Array.isArray(children[0]) ? children[0] : children
  if (tag instanceof ViewDeclaration) return new ViewNode(tag, attrs, {}, childrenArray)
  else return new ElementNode(tag, attrs, childrenArray)
}


export const view = (template, state = none, actions = none, hooks = none) =>
  new ViewDeclaration(template instanceof Function ? template : () => template, state, actions, hooks)


export const mount = (container, node, index = 0) => {
  let viewNode = node
  if (node instanceof ElementNode)
    viewNode = h(view(node))

  const instance = viewNode.instantiate()
  instance.mount(container, index)
  return instance
}


export const decorator = fn => Inner => {
  let innerView;
  if (Inner instanceof ViewDeclaration) innerView = Inner
  else if (typeof Inner === 'string') innerView = view(state => h(Inner, state))
  else innerView = view(Inner)
  const result = fn(innerView)
  if (result instanceof ViewDeclaration) return result
  else return view(result)
}
