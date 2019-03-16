import { h, isElementNode, isViewNode } from 'malina'
import { withTemplate, withLifecycle } from './common'
import { compose } from 'malina-util'
import { memoizedDecorator } from './memoized'

const key = Symbol.for('__malina_styles')
const updateKey = Symbol.for('__malina_styles_update')

const updateStyles = (prev, next) => ({
  ...(next || {}),
  ...(prev || {})
})

const updateStyleAttribute = (prev, next) => {
  if (next != null) return next
  else return prev
}

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
  } else if (isViewNode(node)) {
    const attrs = { ...(node.attrs || null), [updateKey]: { styles, styleAttribute } }
    return h(node.tag, attrs, node.children.map(decorateTemplate(styles, styleAttribute)))
  } else return node
}

const decorateView = memoizedDecorator(compose(
  withTemplate(original =>
    ({ state }) => {
      const { styles: originalStyles, styleAttribute: originalStyleAttribute } = state[key] || {}
      const { styles: updatedStyles, styleAttribute: updatedStyleAttribute } = state[updateKey] || {}
      const styles = updateStyles(originalStyles, updatedStyles)
      const styleAttribute = updateStyleAttribute(originalStyleAttribute, updatedStyleAttribute)
      const node = original()
      return decorateTemplate(styles, styleAttribute)(node)
    })
), true)

export const cssModules = (styles, styleAttribute = 'styleName') => compose(
  decorateView,
  withLifecycle({
    create: ({ state }) => {
      if (key in state)
        state[key] = { styles: { ...state[key].styles, ...styles }, styleAttribute }
      else
        state[key] = { styles: { ...styles }, styleAttribute }
    }
  })
)
