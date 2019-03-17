import { keys } from 'malina-util'
import { render, decorator, getGlobal, h, view } from 'malina'
import { withTemplate, withLifecycle, withState } from './common'

const componentKey = Symbol.for('__malina_component')

const isValidName = name =>
  name.split('-').length >= 2

const requireValidName = name => {
  if (!isValidName(name))
    throw new Error(`"${name}" is not valid custom element name`)
}

const NodeListRenderer = view(null)
  .decorate(
    withState({
      children: [],
      parent: null,
      index: null,
      count: null
    }),
    withLifecycle({
      mount: view => {
        const parent = view.element.parentNode
        const index = Array.prototype.indexOf.call(parent.childNodes, view.element)
        view.state.index = index
        view.state.parent = parent

        parent.childNodes[index].remove()
        const before = parent.childNodes[index]
        for (const node of view.state.children)
          parent.insertBefore(node, before)
        view.state.count = view.state.children.length
      },
      update: view => {
        for (let i = 0; i < view.state.count; i++)
          view.state.parent.childNodes[view.state.index].remove()
        const before = view.state.parent.childNodes[view.state.index]
        for (const node of view.state.children)
          view.state.parent.insertBefore(node, before)
        view.state.count = view.state.children.length
      },
      unmount: view => {
        for (let i = 0; i < view.state.count; i++)
          view.state.parent.childNodes[view.state.index].remove()

        view.state.parent = null
        view.state.index = null
        view.state.count = null
      }
    }))

const getCustomElementClass = (window, declaration, name, { shadow = 'open' }) =>
  class extends window.HTMLElement {
    constructor(...args) {
      const self = super(...args)
      this.view = null
      return self
    }

    connectedCallback(...args) {
      const shadowRoot = this.attachShadow({ mode: shadow })
      const attrs = {}

      for (const attr of this.attributes)
        attrs[attr.name] = attr.value

      if (!('component' in attrs))
        attrs.component = this
      else attrs[componentKey] = this

      const children = [h(NodeListRenderer, { children: this.childNodes })]

      this.view = render(window.document, h(declaration, attrs, children))
      const template = this.view.element
      shadowRoot.appendChild(template.content)
      this.view.attach(shadowRoot)
    }

    // TODO lifecycle
  }

const withComponentTemplate = withTemplate(original => view => {
  const node = original()
  if (node.tag !== 'template')
    throw new Error("Root element of a web-component must be a 'template' element")

  if (keys(node.attrs).length > 0)
    throw new Error('Root element of a web-component must not have any attributes')

  return node
})

const normalizedWebComponent = (_window, name, options = {}) => {
  requireValidName(name)

  return decorator(Inner => {
    if ('customElements' in _window) {
      const cls = getCustomElementClass(_window, withComponentTemplate(Inner), name, options)
      _window.customElements.define(name, cls)
      return cls
    }
    return null
  })
}

const getWindowFromGlobal = () => {
  const _global = getGlobal()
  if (!('window' in _global))
    throw new Error('"window" not found in global scope')

  return _global.window
}

export const webComponent = (...args) => {
  if (args.length === 1) {
    const _window = getWindowFromGlobal()
    return normalizedWebComponent(_window, args[0])
  } else if (args.length === 2) {
    if (typeof args[0] === 'string') {
      const _window = getWindowFromGlobal()
      return normalizedWebComponent(_window, args[0], args[1])
    } else
      return normalizedWebComponent(args[0], args[1])
  } else return normalizedWebComponent(args[0], args[1], args[2])
}

export const withCustomElement = (getter = component => ({ component })) =>
  withState(state => getter(state[componentKey]))
