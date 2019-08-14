import Updater from './updater'

export const getStyleSheet = element => {
  if (element.sheet) return element.sheet

  const size = document.styleSheets.length
  for (let i = 0; i < size; i += 1) {
    const sheet = document.styleSheets[i]
    if (sheet.ownerNode === element) return sheet
  }

  throw new Error('Stylesheet not found for tag')
}

export default class Injector {
  constructor() {
    this.document = null
    this.styleElement = null
    this.stylesheet = null
    this.mediaStyleElements = {}
    this.mediaStylesheets = {}
    this.useMediaStyles = false

    this.clients = new Map()
    this.updater = new Updater(this)
  }

  createMediaStyleElement(id, rule) {
    const element = document.createElement('style')
    element.setAttribute('media', rule)
    document.head.appendChild(element)

    this.mediaStyleElements[id] = element
    this.mediaStylesheets[id] = getStyleSheet(element)
  }

  hasMediaStyleElement(id) {
    return id in this.mediaStyleElements
  }

  getMediaStyleElement(id) {
    return this.mediaStyleElements[id]
  }

  deleteMediaStyleElement(id) {
    this.mediaStyleElements[id].remove()
    delete this.mediaStyleElements[id]
    delete this.mediaStylesheets[id]
  }

  getMediaStylesheet(id) {
    return this.mediaStylesheets[id]
  }

  mount(client, document) {
    if (this.clients.has(client))
      return

    if (this.document === null) {
      this.document = document
      this.styleElement = document.createElement('style')
      document.head.appendChild(this.styleElement)
      this.stylesheet = getStyleSheet(this.styleElement)

      this.useMediaStyles = !('insertRule' in this.stylesheet)
    }

    this.clients.set(client, new Map())
  }

  isMounted(client) {
    return this.clients.has(client)
  }

  update(client, styles) {
    if (!this.clients.has(client))
      throw new Error('Unknown style client')

    const styleMap = new Map()

    const addedStyles = []
    const updatedStyles = []
    const deletedStyles = []
    for (const style of styles) {
      let added = true
      for (const key of this.clients.keys()) {
        if (this.clients.get(key).has(style.id)) {
          added = false
          break
        }
      }

      if (added) addedStyles.push(style)
      else updatedStyles.push(style)
      styleMap.set(style.id, style)
    }

    for (const style of this.clients.get(client))
      if (!styleMap.has(style.id)) deletedStyles.push(style)

    this.clients.set(client, styleMap)

    this.updater.add(addedStyles)
    this.updater.update(updatedStyles)
    this.updater.delete(deletedStyles)
  }

  destroy(client) {
    if (!this.clients.has(client))
      return

    this.update(client, [])
    this.clients.delete(client)

    if (this.clients.size === 0) {
      this.destroyElements()
      this.document = null
      this.styleElement = null
      this.stylesheet = null
      this.mediaStyleElements = {}
      this.mediaStylesheets = {}
      this.useMediaStyles = false
    }
  }

  insertMainStyle(style, index) {
    if (!style.rules)
      return true

    return this.insertStyle(this.stylesheet, style.selector, style.rules, index)
  }

  deleteMainStyle(index, count) {
    const start = index
    for (let i = start; i > start - count; i -= 1)
      this.stylesheet.deleteRule(i)
  }

  insertMediaStyle(style) {
    if (style.parsedRule.rules.length === 0)
      return

    if (!this.hasMediaStyleElement(style.id))
      this.createMediaStyleElement(style.id, style.atRule)
    const sheet = this.getMediaStylesheet(style.id)

    let inserted = true
    for (const i in style.parsedRule.rules) {
      const rule = style.parsedRule.rules[i]
      inserted = this.insertStyle(sheet, rule.selector, rule.getStyle(), i)
      if (!inserted)
        break
    }

    if (!inserted)
      this.deleteMediaStyleElement(style.id)
    return inserted
  }

  deleteMediaStyle(id) {
    this.deleteMediaStyleElement(id)
  }

  /** @private */
  insertStyle(sheet, selector, rules, index) {
    if (!rules) return true

    const maxIndex = sheet.cssRules.length

    try {
      const safeIndex = (index <= maxIndex ? index : maxIndex)
      if ('insertRule' in sheet)
        sheet.insertRule(`${selector}{${rules}}`, safeIndex)
      else if ('addRule' in sheet)
        sheet.addRule(selector, rules)
      return true
    } catch (error) {
      return false
    }
  }

  /** @private */
  destroyElements() {
    this.styleElement.remove()
    for (const element of Object.values(this.mediaStyleElements))
      element.remove()
  }
}
