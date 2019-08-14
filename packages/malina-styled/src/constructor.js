import { shallowEqual, memoize } from 'malina-util'
import styledView from './view'
import tagList from './tag-list'

const CONSTRUCTOR_MEM_LENGTH = 100

const staticTemplateFactory = parts => {
  const str = parts.join('')
  return () => str
}

const dynamicTemplateFactory = (parts, exprs) => memoize(state => {
  let css = ''
  let nextPart = true
  let i = 0
  while (i < parts.length) {
    if (nextPart) css += parts[i]
    else {
      const expr = exprs[i]
      css += expr instanceof Function ? expr(state) : `${expr}`
    }

    nextPart = i >= exprs.length || !nextPart
    if (nextPart)
      i += 1
  }

  return css
}, CONSTRUCTOR_MEM_LENGTH, shallowEqual)

const templateToFactory = (parts, exprs) =>
  exprs.length > 0 ? dynamicTemplateFactory(parts, exprs) : staticTemplateFactory(parts)

const mergeFactories = (...fns) => state =>
  fns
    .map(fn => fn(state))
    .join('')

const styled = view => (parts, ...exprs) => {
  if (view == null)
    throw new Error('Nothing to extend')

  if (!view.isStyled)
    throw new Error('Styled views can only extend other styled views')

  return styledView(view.tag, mergeFactories(view.factory, templateToFactory(parts, exprs)))
}

for (const tag of tagList) {
  styled[tag] = (parts, ...exprs) =>
    styledView(tag, templateToFactory(parts, exprs))
}

export default styled
