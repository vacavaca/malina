import { isElementNode, isViewNode, h, isDevelopment } from 'malina'
import { compose, genRandomId } from 'malina-util'
import { withContext, getContext } from './context'
import { withTemplate } from './common'

const key = Symbol('ids')

const mapTemplate = (length, ctx) => node => {
  if (ctx == null)
    return node

  if (Array.isArray(node))
    return node.map(mapTemplate(length, ctx.ids))
  else if (isElementNode(node)) {
    let nextAttrs = node.attrs
    if ('id' in node.attrs) {
      const passed = node.attrs['id']
      nextAttrs = { ...node.attrs }
      if (passed in ctx.ids)
        nextAttrs['id'] = ctx.ids[passed]
      else {
        let random
        if (isDevelopment) {
          let id = ++ctx.id
          random = `${id}`
          while (random.length < length)
            random = `0${random}`
        } else random = genRandomId(length)

        const generated = `${passed}_${random}`
        ctx.ids[passed] = generated
        nextAttrs['id'] = generated
      }
    }

    return h(node.tag, nextAttrs, node.children.map(mapTemplate(length, ctx)))
  } else if (isViewNode(node)) {
    let nextAttrs = { ...node.attrs }
    nextAttrs[key] = ctx
    return h(node.tag, nextAttrs, node.children)
  } else return node
}

export const withUniqIds = (length = 4) =>
  compose(
    getContext(ctx => key in ctx ? { [key]: ctx[key] } : {}),
    withContext(state => {
      if (!(key in state)) return { [key]: { ids: {}, id: 0 } }
      else return {}
    }),
    withTemplate(original => (state, actions, children) =>
      mapTemplate(length, state[key])(original(state, actions, children)))
  )
