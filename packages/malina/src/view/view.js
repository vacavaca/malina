import { shallowEqual, compose, keys } from 'malina-util'
import { h, isElementNode, isViewNode, isTextNode, Declaration } from '../vdom'
import { Dispatcher } from '../concurrent'
import { isProduction, testDevelopment } from '../env'
import { InnerFacade, ConcurrentFacade, OuterFacade } from './facade'
import { toOnEventName, normalizeEventName } from './event'
import { defaultContext } from './context'

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

const isTemplateElement = element =>
  element instanceof element.ownerDocument.defaultView.HTMLTemplateElement

const requireValidChildren = compose(
  requireKeysSet,
  requireUniqueKeys,
  requireNoInnerHtmlOverlap
)

class View {
  constructor(node, context) {
    const { tag: declaration, attrs: state, children } = node

    this.template = declaration.template
    this.state = state
    this.actions = this.bindActions(declaration.actions)
    this.behavior = declaration.behavior
    this.dispatcher = new Dispatcher()
    this.innerFacade = new InnerFacade(this)
    this.children = children
    this.mounted = false
    this.attached = false
    this.destroyed = false

    this.context = context.update({ mounting: false })
    this.templateLock = false
    this.element = null
    this.node = null
    this.innerViews = new Map()
    this.parametrizedEventListeners = new Map()
    this.scheduledActions = []
    this.trackedActionUpdate = false

    this.runBehavior()
  }

  render(document) {
    let top = false
    if (this.destroyed)
      throw new Error('View is destroyed')

    if (this.element != null)
      throw new Error('view is already rendered')

    if (!this.context.store.mountLock) {
      top = true
      this.context = this.context
        .update({ store: { ...this.context.store, mounting: true, mountLock: true } })
    }

    const next = this.renderTemplate()
    if (Array.isArray(next))
      throw new Error('View can only have one root element')

    let element = null
    if (isElementNode(next))
      element = this.createNodeElement(document, next, [], this.context)
    else if (isViewNode(next)) {
      const view = this.instantiateInnerView(next, [], this.context)
      element = view.render(document)
      view.attach()
    } else if (isTextNode(next))
      element = document.createTextNode(`${next != null ? next : ''}`)
    else throw new Error('Invalid template type')

    this.element = element
    this.node = next

    for (const [action, args] of this.scheduledActions)
      this.callAction(action, ...args)
    this.scheduledActions = []

    if (top) {
      this.context = this.context
        .update({ store: { ...this.context.store, mounting: false, mountLock: false } })
    }

    return this.element
  }

  attach(element = null) {
    if (this.destroyed)
      throw new Error('View is destroyed')

    if (this.mounted)
      throw new Error('View is already mounted')

    const top = !this.context.store.mountLock

    element = element != null ? element : this.element

    this.element = element
    this.mounted = true

    if (top) {
      const queue = this.context.store.mountHookQueue
      this.context = this.context
        .update({ store: { ...this.context.store, mountLock: false, mountHookQueue: [] } })

      for (const hook of queue)
        hook()

      this.dispatcher.notify('mount', [this.element])
    } else
      this.context.store.mountHookQueue.push(() => this.dispatcher.notify('mount', [this.element]))
  }

  mount(container, index) {
    if (this.destroyed)
      throw new Error('View is destroyed')

    if (this.mounted)
      throw new Error('View is already mounted')

    const document = container.ownerDocument
    this.render(document)

    const fragment = isTemplateElement(container) ? container.content : container
    const before = fragment.childNodes[index] || null
    fragment.insertBefore(this.element, before)

    this.attach()
  }

  move(container, index) {
    const fragment = isTemplateElement(container) ? container.content : container
    const before = fragment.childNodes[index] || null
    fragment.insertBefore(this.element, before)
  }

  update(state = null, children = null) {
    let update = false
    if (this.destroyed)
      throw new Error('View has been destroyed')

    const nextState = this.updateState(state)
    const nextChildren = this.updateChildrenState(children)

    update = this.state !== nextState || this.children !== nextChildren

    this.state = nextState
    this.children = nextChildren

    if (this.mounted && update)
      this.refresh()

    if (this.mounted && update)
      this.dispatcher.notify('update', [this.state])

    return update
  }

  destroy(removeElement = true) {
    this.unmount(removeElement)
    this.destroyed = true
    this.dispatcher.notify('destroy')
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
  refresh() {
    const next = this.renderTemplate()
    const prev = this.node
    this.node = next
    this.patch(this.element, prev, next, [], this.context)
  }

  /** @private */
  runBehavior() {
    if (this.behavior instanceof Function)
      this.behavior(new ConcurrentFacade(this))
  }

  /** @private */
  unmount(removeElement) {
    this.mounted = false
    if (isElementNode(this.node))
      this.destroyInnerViews(this.node, [])
    else if (isViewNode(this.node))
      this.destroyInnerView([])

    if (removeElement)
      this.element.remove()

    this.element = null
    this.dispatcher.notify('unmount')
  }

  /** @private */
  renderTemplate() {
    this.templateLock = true
    try {
      let next = this.template(this.innerFacade)
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
      result = result(this.innerFacade)
    else if (result instanceof Promise) {
      return (async () => {
        this.finishAction(update)
        result = await result
        if (result instanceof Function)
          result = result(this.innerFacade)

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
        let notify = false
        const updated = this.update(result)
        if (!updated && this.trackedActionUpdate) {
          this.trackedActionUpdate = false
          this.refresh()
          notify = true
        } else
          this.trackedActionUpdate = false

        if (notify)
          this.dispatcher.notify('update', this.state)
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
  destroyInnerViews(node, path) {
    let shift = 0
    for (const ndx in node.children) {
      const child = node.children[ndx]
      if (this.context.options.isProduction && child.isDevOnly) {
        shift += 1
        continue
      }
      const nextPath = path.concat([ndx - shift])
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
  attachNodeElement(element, node, path, context) {
    this.attachChildren(element, node, path, context)
    return element
  }

  /** @private */
  mountNodeElement(container, index, node, path, context) {
    const document = container.ownerDocument
    let element = this.createNodeElement(document, node, path, context)
    const before = container.childNodes[index] || null
    container.insertBefore(element, before)
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
  attachChildren(element, node, path, context) {
    if (!requireValidChildren(node))
      throw new Error("Every view node in an array must have an unique 'key' attribute")

    let shift = 0
    if (!('innerHtml' in node.attrs)) {
      for (const ndx in node.children) {
        const child = node.children[ndx]
        if (context.options.isProduction && child.isDevOnly) {
          shift += 1
          continue
        }

        const nextPath = path.concat([ndx - shift])
        this.attachChild(element, child, ndx - shift, nextPath, context)
      }
    }
  }

  /** @private */
  refreshChildren(element, node, path, context) {
    if (!requireValidChildren(node))
      throw new Error("Every view node in an array must have an unique 'key' attribute")

    if ('innerHtml' in node.attrs)
      element.innerHTML = node.attrs.innerHtml
    else {
      let shift = 0
      for (const ndx in node.children) {
        const child = node.children[ndx]
        if (context.options.isProduction && child.isDevOnly) {
          shift += 1
          continue
        }

        const nextPath = path.concat([ndx - shift])
        this.addChildren(element, child, ndx - shift, nextPath, context)
      }
    }
  }

  /** @private */
  attachChild(element, child, ndx, path, context) {
    if (isElementNode(child))
      this.attachNodeElement(element, ndx, child, path, context)
    else if (isViewNode(child)) {
      const view = this.instantiateInnerView(child, path, context)
      view.attach(element, ndx)
    }
  }

  /** @private */
  addChildren(element, child, ndx = null, path, context) {
    if (isElementNode(child)) {
      if (context.mounting) this.mountNodeElement(element, ndx, child, path, context)
      else {
        const childElement = this.createNodeElement(element.ownerDocument, child, path, context)
        if (isTemplateElement(element))
          element.content.appendChild(childElement)
        else element.appendChild(childElement)
      }
    } else if (isViewNode(child)) {
      const view = this.instantiateInnerView(child, path, context)
      view.mount(element, ndx)
    } else if (child != null) {
      const childElement = element.ownerDocument.createTextNode(`${child}`)
      if (isTemplateElement(element))
        element.content.appendChild(childElement)
      else element.appendChild(childElement)
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
        let prevChild = prev.children[ndx]
        let nextChild = ndx in next.children ? next.children[ndx] : null
        if (context.options.isProduction) {
          if (prevChild != null && nextChild != null && prevChild.isDevOnly && nextChild.isDevOnly)
            continue
          else if (prevChild != null && prevChild.isDevOnly)
            prevChild = null
          else if (nextChild != null && nextChild.isDevOnly)
            nextChild = null
        }

        const childNode = element.childNodes[ndx - nodeIndexShift]
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
    const view = new View(node, context)
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

    let shift = 0
    for (const ndx in node.children) {
      const child = node.children[ndx]
      if (this.context.options.isProduction && child.isDevOnly) {
        shift += 1
        continue
      }
      const nextPath = path.concat([ndx - shift])
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

const mountOrAttach = (container, node, index, {
  insideSvg, attach, isProduction
}) => {
  let viewNode = node
  if (isElementNode(node))
    viewNode = h(view(node))

  const store = {
    mountLock: false,
    mountHookQueue: []
  }

  let context = defaultContext({ store, isProduction })
    .setSvg(insideSvg)

  if (!context.svg) {
    const global = container.ownerDocument.defaultView
    context = context.setSvg(container instanceof global.SVGElement)
  }

  const fragment = isTemplateElement(container) ? container.content : container

  if (!isViewNode(viewNode))
    throw new Error('View can only be instantiated from view-nodes')
  const viewInstance = new View(viewNode, context)
  if (attach) viewInstance.attach(fragment.childNodes[index])
  else viewInstance.mount(fragment, index)
  return new OuterFacade(viewInstance)
}

export const mount = (container, node, index = 0, {
  insideSvg = false, env = isProduction ? 'production' : 'development'
} = {}) => mountOrAttach(container, node, index, { insideSvg, attach: false, isProduction: !testDevelopment(env) })

export const attach = (container, node, index = 0, {
  insideSvg = false, env = isProduction ? 'production' : 'development'
} = {}) => mountOrAttach(container, node, index, { insideSvg, attach: true, isProduction: !testDevelopment(env) })

export const render = (document, node, {
  insideSvg = false,
  env = isProduction ? 'production' : 'development'
} = {}) => {
  let viewNode = node
  if (isElementNode(node))
    viewNode = h(view(node))

  const store = {
    mountLock: false,
    mountHookQueue: []
  }

  let context = defaultContext({ store, isProduction })
    .setSvg(insideSvg)

  if (!isViewNode(viewNode))
    throw new Error('View can only be instantiated from view-nodes')
  const viewInstance = new View(viewNode, context)
  viewInstance.render(document)
  return new OuterFacade(viewInstance)
}

export const view = (template, behavior, actions) =>
  new Declaration(template instanceof Function ? template : () => template, behavior, actions)
