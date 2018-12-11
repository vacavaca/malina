import { h, isViewNode, isElementNode, decorator } from 'malina'
import { withTemplate } from './common'

const decoratedCache = new Map()
const decoratedCacheLimit = 10000

const memoizeDecorated = wrapped => decorator(Inner => {
  if (decoratedCache.has(Inner.template)) return decoratedCache.get(Inner.template)
  else {
    let decorated = wrapped(Inner)
    if (decoratedCache.size < decoratedCacheLimit)
      decoratedCache.set(Inner.template, decorated)
    return decorated
  }
})

const setClasses = (styles, styleAttribute) => memoizeDecorated(withTemplate(original =>
  (state, actions, children) => {
    const node = original(state, actions, children)
    return decorateTemplate(styles, styleAttribute)(node)
  }))

const decorateTemplate = (styles, styleAttribute) => node => {
  if (isViewNode(node))
    return h(setClasses(styles)(node.tag), node.attrs, node.children.map(decorateTemplate(styles, styleAttribute)))
  else if (isElementNode(node)) {
    if (node.attrs != null && styleAttribute in node.attrs) {
      const names = (node.attrs[styleAttribute] || '').split(' ').filter(name => name.length > 0)
      const existing = (node.attrs.class || '').split(' ').filter(name => name.length > 0)

      const styleClasses = names.map(name => styles[name])
        .filter(cl => cl != null)
        .concat(existing)
        .join(' ')
      const attrs = { ...node.attrs }
      delete attrs[styleAttribute]

      if (styleClasses.length > 0)
        attrs.class = styleClasses

      return h(node.tag, attrs, node.children.map(decorateTemplate(styles, styleAttribute)))
    } else
      return h(node.tag, node.attrs, node.children.map(decorateTemplate(styles, styleAttribute)))
  } else return node
}

export default (styles, styleAttribute = 'styleName') =>
  decorator(View => setClasses(styles, styleAttribute)(View))
