import { keys, shallowEqual } from 'malina-util'
import { Dispatcher } from '../concurrent'
import { TemplateFacade, ActionFacade, ConcurrentFacade, OuterFacade } from './facade'
import { assert, isProduction, testDevelopment } from '../env'
import RenderContext from './render-context'
import StateContext from './state-context'
import { h, Node, createTemplate } from '../vdom'
import { isTemplateElement } from './util'
import ViewTree from './view-tree'
import Renderer from './renderer'

class View {
  constructor(renderContext, node, stateContext = null) {
    const { tag: declaration, attrs: state, children } = node

    this.template = createTemplate(declaration.template)
    this.state = state
    this.actions = this.bindActions(declaration.actions)
    this.behavior = declaration.behavior
    this.dispatcher = new Dispatcher()
    this.templateFacade = new TemplateFacade(this)
    this.actionFacade = new ActionFacade(this)
    this.children = children
    this.id = declaration.id

    this.renderContext = renderContext
    this.tree = new ViewTree()
    this.renderer = new Renderer(this, renderContext)
    this.node = null
    this.destroyed = false
    this.templateLock = false
    this.updateLock = false
    this.trackedActionUpdate = false
    this.tmpElement = null
    this.stateContext = stateContext != null ? stateContext : null
    this.stateContextSubscription = null
    this.stateContextProvider = null
    this.stateContextConsumer = null

    this.runBehavior()
  }

  get element() {
    return this.renderer.element || this.tmpElement
  }

  render() {
    if (this.destroyed)
      throw new Error('View is destroyed')

    this.tmpElement = null
    this.node = this.renderTemplate()

    return this.renderer.render(this.node)
  }

  hydrate(element) {
    if (this.destroyed)
      throw new Error('View is destroyed')

    if (this.element != null)
      throw new Error('View is already hydrated')

    this.tmpElement = null

    if (this.node == null)
      this.node = this.renderTemplate()

    const top = !this.renderContext.isLocked()
    if (top)
      this.renderContext.lock()

    this.renderer.deferElementAttach()
    this.renderer.hydrate(element, this.node)

    if (top) {
      this.renderContext.unlock()
      const queue = this.renderContext.getCallbackQueue('mount')

      while (queue.length > 0) {
        const hook = queue.splice(0, 1)[0]
        hook()
      }

      this.dispatcher.notify('mount', [this.element])

      this.renderer.flushAttachQueue()
    } else {
      const queue = this.renderContext.getCallbackQueue('mount')
      queue.push(() => {
        this.dispatcher.notify('mount', [this.element])
        this.renderer.flushAttachQueue()
      })
    }
  }

  attach(element) {
    if (this.destroyed)
      throw new Error('View is destroyed')

    if (this.element != null)
      throw new Error('View is already attached')

    this.tmpElement = null

    if (this.node == null)
      this.node = this.renderTemplate()

    const top = !this.renderContext.isLocked()
    if (top)
      this.renderContext.lock()

    this.renderer.deferElementAttach()
    this.renderer.attach(element, this.node)

    if (top) {
      this.renderContext.unlock()
      const queue = this.renderContext.getCallbackQueue('mount')

      while (queue.length > 0) {
        const hook = queue.splice(0, 1)[0]
        hook()
      }

      this.dispatcher.notify('mount', [this.element])
      this.renderer.flushAttachQueue()
    } else {
      const queue = this.renderContext.getCallbackQueue('mount')
      queue.push(() => {
        this.dispatcher.notify('mount', [this.element])
        this.renderer.flushAttachQueue()
      })
    }
  }

  mount(container, index) {
    if (this.destroyed)
      throw new Error('View is destroyed')

    this.tmpElement = null

    const top = !this.renderContext.isLocked()
    if (top)
      this.renderContext.lock()

    if (this.node == null)
      this.node = this.renderTemplate()

    const element = this.renderer.render(this.node)
    this.renderer.deferElementAttach()
    this.renderer.mount(element, container, index)
    this.renderer.attach(element, this.node)

    if (top) {
      this.renderContext.unlock()
      const queue = this.renderContext.getCallbackQueue('mount')

      while (queue.length > 0) {
        const hook = queue.splice(0, 1)[0]
        hook()
      }

      this.dispatcher.notify('mount', [this.element])
      this.renderer.flushAttachQueue()
    } else {
      const queue = this.renderContext.getCallbackQueue('mount')
      queue.push(() => {
        this.dispatcher.notify('mount', [this.element])
        this.renderer.flushAttachQueue()
      })
    }
  }

  move(container, index) {
    this.tmpElement = null
    this.renderer.move(container, index)
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

    if (this.element !== null && update)
      this.refresh()

    this.updateContext(update)

    if (this.element !== null && update)
      this.dispatcher.notify('update', [this.state])

    return update
  }

  unmount() {
    if (this.destroyed)
      throw new Error('View has been destroyed')

    if (this.element === null)
      throw new Error('View has been already unmounted')

    const top = !this.renderContext.isLocked()
    if (top)
      this.renderContext.lock()

    this.tmpElement = this.element
    this.renderer.detach(this.node)

    if (top) {
      this.renderContext.unlock()
      const queue = this.renderContext.getCallbackQueue('unmount')

      while (queue.length > 0) {
        const hook = queue.splice(0, 1)[0]
        hook()
      }

      this.dispatcher.notify('unmount')
      this.tmpElement = null
    } else {
      const queue = this.renderContext.getCallbackQueue('unmount')
      queue.push(() => {
        this.dispatcher.notify('unmount')
        this.tmpElement = null
      })
    }
  }

  destroy(removeElement = true) {
    if (this.destroyed)
      throw new Error('View has been destroyed')

    const element = this.element
    if (element !== null)
      this.unmount()

    const top = !this.renderContext.isLocked()
    if (top)
      this.renderContext.lock()

    if (this.stateContextSubscription !== null) {
      this.stateContextSubscription() // unsubscribe
      this.stateContextSubscription = null
    }

    this.destroyInnerViews([], false)
    if (removeElement && element != null)
      element.remove()

    this.node = null
    this.destroyed = true

    assert(() => this.tree.isEmpty(), 'View tree is empty after destroy')

    if (top) {
      this.renderContext.unlock()
      const queue = this.renderContext.getCallbackQueue('destroy')

      while (queue.length > 0) {
        const hook = queue.splice(0, 1)[0]
        hook()
      }

      this.dispatcher.notify('destroy')
    } else {
      const queue = this.renderContext.getCallbackQueue('destroy')
      queue.push(() => this.dispatcher.notify('destroy'))
    }
  }

  getOrInstantiateInnerView(node, path, renderContext) {
    if (!this.tree.hasView(path))
      return this.instantiateInnerView(node, path, renderContext)

    return this.tree.getView(path)
  }

  instantiateInnerView(node, path, renderContext) {
    assert(() => !this.tree.hasView(path), 'View tree overwrite')

    const view = new View(renderContext, node, this.stateContext)
    this.tree.addView(path, view)
    return view
  }

  getInstantiatedInnerView(path) {
    return this.tree.getView(path)
  }

  destroyInnerViews(path, removeElement = true) {
    for (const treeNode of this.tree.iterateViews(path)) {
      const view = treeNode.view
      view.destroy(removeElement)
      treeNode.delete()
    }
  }

  destroyInnerView(path, removeElement = true) {
    const view = this.tree.getView(path)
    this.tree.removeView(path)
    view.destroy(removeElement)
  }

  initializeContext(provider) {
    const value = provider(this)
    if (value == null)
      return

    if (this.stateContext != null) this.stateContext.update(value)
    else this.stateContext = new StateContext(value)

    this.stateContextProvider = provider
  }

  subscribeContext(consumer) {
    if (this.stateContext != null) {
      this.state = { ...this.state, ...(consumer(this.stateContext.value) || {}) }
      if (this.stateContextSubscription !== null)
        this.stateContextSubscription()
      this.stateContextSubscription = this.stateContext.subscribe(value => this.update(consumer(value)))
    }

    this.stateContextConsumer = consumer
  }

  /** @private */
  updateContext(updated) {
    if (this.stateContext == null)
      return

    if (updated && this.stateContextProvider != null)
      this.stateContext.update(this.stateContextProvider(this))

    if (updated && this.stateContextConsumer != null)
      this.state = { ...this.state, ...(this.stateContextConsumer(this.stateContext.value) || {}) }
  }

  /** @private */
  runBehavior() {
    if (this.behavior instanceof Function)
      this.behavior(new ConcurrentFacade(this))
  }

  /** @private */
  refresh() {
    const next = this.renderTemplate()
    const prev = this.node
    this.node = next
    this.renderer.update(prev, next)
  }

  /** @private */
  renderTemplate() {
    this.templateLock = true
    try {
      let next = this.template(this.templateFacade)
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
      throw new Error("Actions can't be called during template render")

    const update = !this.updateLock

    this.updateLock = true
    let result = action(...args)
    if (result instanceof Function)
      result = result(this.actionFacade)
    else if (result instanceof Promise) {
      return (async () => {
        this.finishAction(update)
        result = await result
        if (result instanceof Function)
          result = result(this.actionFacade)

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
      if (!this.destroyed && this.element !== null) {
        let notify = false
        const updated = this.update(result)
        if (!updated && this.trackedActionUpdate) {
          this.trackedActionUpdate = false
          this.refresh()
          this.updateContext(true)
          notify = true
        } else
          this.trackedActionUpdate = false

        if (notify)
          this.dispatcher.notify('update', [this.state])
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

    const nextState = {}
    let updated = false
    for (const key of keys(update)) {
      if (typeof key === 'symbol') this.state[key] = update[key]
      else {
        nextState[key] = update[key]
        updated = updated || update[key] !== this.state[key]
      }
    }

    if (!updated)
      return this.state

    for (const key of keys(this.state)) {
      if (!(key in nextState))
        nextState[key] = this.state[key]
    }

    return nextState
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
}

const mountOrHydrate = (container, node, index, {
  insideSvg, hydrate, isProduction
}) => {
  const viewNode = Node.isNode(node) ? node : h(node)
  const document = container.ownerDocument

  let renderContext = RenderContext.initialize(document, {
    production: isProduction,
    svg: insideSvg
  })

  if (!renderContext.isSvg()) {
    const _window = document.defaultView
    if (container instanceof _window.SVGElement)
      renderContext = renderContext.setSvg(true)
  }

  const viewInstance = new View(renderContext, viewNode)
  const fragment = isTemplateElement(container) ? container.content : container
  if (hydrate) viewInstance.hydrate(fragment.childNodes[index])
  else viewInstance.mount(fragment, index)
  return new OuterFacade(viewInstance)
}

export const mount = (container, node, index = 0, {
  insideSvg = false, env = isProduction ? 'production' : 'development'
} = {}) => mountOrHydrate(container, node, index, { insideSvg, hydrate: false, isProduction: !testDevelopment(env) })

export const hydrate = (container, node, index = 0, {
  insideSvg = false, env = isProduction ? 'production' : 'development'
} = {}) => mountOrHydrate(container, node, index, { insideSvg, hydrate: true, isProduction: !testDevelopment(env) })

export const instantiate = (document, node, {
  insideSvg = false,
  env = isProduction ? 'production' : 'development'
} = {}) => {
  const viewNode = Node.isNode(node) ? node : h(node)

  const renderContext = RenderContext.initialize(document, {
    production: isProduction,
    svg: insideSvg
  })

  const viewInstance = new View(renderContext, viewNode)
  return new OuterFacade(viewInstance)
}

export const render = (document, node, {
  insideSvg = false,
  env = isProduction ? 'production' : 'development'
} = {}) => {
  const viewInstance = instantiate(document, node, { insideSvg, env })
  viewInstance.render()
  return new OuterFacade(viewInstance)
}
