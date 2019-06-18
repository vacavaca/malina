import { keys } from 'malina-util'
import { instantiate, decorator, getGlobal, h } from 'malina'
import { mapTemplate } from './common'

const isValidName = name =>
  name.split('-').length >= 2

const requireValidName = name => {
  if (!isValidName(name))
    throw new Error(`"${name}" is not valid custom element name`)
}

const getCustomElementClass = (window, declaration, name, { shadow = 'open', observe = [] }) =>
  class extends window.HTMLElement {
    constructor(...args) {
      const self = super(...args)
      this.view = null
      this.childObserver = new window.MutationObserver(this.handleChildMutations.bind(this))
      this.expectedRemove = []
      this.waitingChildren = true
      return self
    }

    static get observedAttributes() {
      return observe || []
    }

    connectedCallback() {
      if (this.view == null) {
        const shadowRoot = this.attachShadow({ mode: shadow })
        const attrs = {}

        for (const attr of this.attributes)
          attrs[attr.name] = attr.value

        const children = Array.from(this.childNodes)

        this.view = instantiate(window.document, h(declaration, attrs, children))
        const template = this.view.render()
        shadowRoot.appendChild(template.content)
      }

      this.view.attach(this.shadowRoot)
      this.childObserver.observe(this, { childList: true })
    }

    disconnectedCallback() {
      this.childObserver.disconnect()
      this.view.unmount()
    }

    attributeChangedCallback(name, prevValue, nextValue) {
      if (this.view != null) {
        this.view.update({
          [name]: nextValue
        })
      }
    }

    destroy() {
      this.view.destroy()
    }

    /** @private */
    handleChildMutations(mutations) {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          this.updateChildren(mutation)
          break
        }
      }
    }

    /** @private */
    updateChildren(mutation) {
      if (this.waitingChildren) {
        this.waitingChildren = false
        const children = Array.from(this.childNodes)
        this.expectedRemove = children
        this.view.update(null, children)
      } else {
        const len = this.expectedRemove.length
        if (len !== mutation.removedNodes.length) {
          this.waitingChildren = true
          this.updateChildren(mutation)
          return
        }

        for (let i = 0; i < len; i++) {
          const expected = this.expectedRemove[i]
          const actual = mutation.removedNodes[i]
          if (expected !== actual) {
            this.waitingChildren = true
            this.updateChildren(mutation)
            return
          }
        }

        this.waitingChildren = true
        this.expectedRemove = null
      }
    }
  }

const withComponentTemplate = mapTemplate(original => view => {
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
