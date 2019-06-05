import { isElementNode, h, isDevelopment, getGlobal } from 'malina'
import { compose, Random } from 'malina-util'
import { withContext, getContext } from './context'
import { withTemplate } from './common'

const key = Symbol.for('__malina_ids')
const randomKey = Symbol.for('__malina-decorator.id.random')

const global_ = getGlobal()
let random
if (global_ != null && randomKey in global_) random = global_[randomKey]
else {
  random = new Random('malina-decorator.id-seed')
  if (global_ != null)
    global_[randomKey] = random
}

const mapTemplate = (length, realKey, ctx) => node => {
  if (ctx == null)
    return node

  if (Array.isArray(node))
    return node.map(mapTemplate(length, realKey, ctx.ids))
  else if (isElementNode(node)) {
    let nextAttrs = node.attrs
    if (realKey in node.attrs) {
      const id = node.attrs[realKey]
      nextAttrs = { ...node.attrs, id }
      delete nextAttrs[realKey]
    } else if ('id' in node.attrs) {
      const passed = node.attrs['id']
      nextAttrs = { ...node.attrs }
      if (passed in ctx.ids)
        nextAttrs['id'] = ctx.ids[passed]
      else {
        let randomId
        if (isDevelopment) {
          let id = ++ctx.id
          randomId = `${id}`
          while (randomId.length < length)
            randomId = `0${randomId}`
        } else randomId = random.id(length)

        const generated = `${passed}_${randomId}`
        ctx.ids[passed] = generated
        nextAttrs['id'] = generated
      }
    }

    return h(node.tag, nextAttrs, node.children.map(mapTemplate(length, realKey, ctx)))
  } else return node
}

export const withUniqIds = (length = 4, realKey = 'realId') =>
  compose(
    getContext(ctx => key in ctx ? { [key]: ctx[key] } : {}),
    withContext(({ state }) => {
      if (!(key in state)) {
        const context = { ids: {}, id: 0 }
        state[key] = context
        return { [key]: context }
      } else return {}
    }),
    withTemplate(original => view =>
      mapTemplate(length, realKey, view.state[key])(original()))
  )
