import { h, isElementNode } from 'malina'
import { withTemplate } from './common'

const decorateTemplate = (styles, styleAttribute) => node => {
  if (isElementNode(node)) {
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
    } else return h(node.tag, node.attrs, node.children.map(decorateTemplate(styles, styleAttribute)))
  } else return node
}

export const cssModules = (styles, styleAttribute = 'styleName') => withTemplate(original =>
  (state, actions, children) => {
    const node = original(state, actions, children)
    return decorateTemplate(styles, styleAttribute)(node)
  })
