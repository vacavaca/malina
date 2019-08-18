import { isElementNode, h, isDevelopment, getGlobal, mapTemplate, withContext, getContext } from 'malina'
import { compose, Random } from 'malina-util'

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

const mapIdTemplate = (length, realPrefix, ctx) => node => {
  if (ctx == null)
    return node

  if (Array.isArray(node))
    return node.map(mapIdTemplate(length, realPrefix, ctx.ids))
  else if (isElementNode(node)) {
    let nextAttrs = node.attrs
    const realIdName = `${realPrefix}Id`
    const realForName = `${realPrefix}HtmlFor`

    const replaceAttributes = []
    if (realIdName in node.attrs) {
      const id = node.attrs[realIdName]
      nextAttrs = { ...node.attrs, id }
      delete nextAttrs[realIdName]
    } else if ('id' in node.attrs)
      replaceAttributes.push('id')

    if (realForName in node.attrs) {
      const fr = node.attrs[realForName]
      nextAttrs = { ...node.attrs, for: fr }
      delete nextAttrs[realForName]
    } else if ('htmlFor' in node.attrs)
      replaceAttributes.push('htmlFor')

    for (const replace of replaceAttributes) {
      const passed = node.attrs[replace]
      nextAttrs = { ...node.attrs }
      if (passed in ctx.ids)
        nextAttrs[replace] = ctx.ids[passed]
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
        nextAttrs[replace] = generated
      }
    }

    return h(node.tag, nextAttrs, node.children.map(mapIdTemplate(length, realPrefix, ctx)))
  } else return node
}

export const withUniqIds = (length = 4, realPrefix = 'real') =>
  compose(
    getContext(ctx => key in ctx ? { [key]: ctx[key] } : {}),
    withContext(({ state }) => {
      if (!(key in state)) {
        const context = { ids: {}, id: 0 }
        state[key] = context
        return { [key]: context }
      } else return {}
    }),
    mapTemplate(original => view =>
      mapIdTemplate(length, realPrefix, view.state[key])(original()))
  )
