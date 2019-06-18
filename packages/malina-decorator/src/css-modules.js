import { h, isElementNode, isViewNode } from 'malina'
import { mapTemplate, withLifecycle } from './common'
import { compose, keys } from 'malina-util'
import { memoizedDecorator } from './memoized'

const stylesKey = Symbol.for('__malina_styles')
const attributeKey = Symbol.for('__malina_styles_attribute')
const updateStylesKey = Symbol.for('__malina_styles_update')
const updateAttributeKey = Symbol.for('__malina_styles_update_attribute')

const updateStyles = (prev, next) => {
  if (next == null || keys(next).length === 0) return prev || {}
  else if (prev == null || keys(prev).length === 0) return next || {}
  else return { ...(next || {}), ...(prev || {}) }
}

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
    const attrs = { ...(node.attrs || null), [updateStylesKey]: styles, [updateAttributeKey]: styleAttribute }
    return h(node.tag, attrs, node.children.map(decorateTemplate(styles, styleAttribute)))
  } else return node
}

const decorateView = memoizedDecorator(compose(
  mapTemplate(original =>
    ({ state }) => {
      const { [stylesKey]: originalStyles, [attributeKey]: originalStyleAttribute } = state || {}
      const { [updateStylesKey]: updatedStyles, [updateAttributeKey]: updatedStyleAttribute } = state || {}
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
      state[stylesKey] = updateStyles(state[stylesKey], styles)
      state[attributeKey] = updateStyleAttribute(state[attributeKey], styleAttribute)
    }
  })
)
