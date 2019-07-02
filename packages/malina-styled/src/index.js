import { view } from 'malina'
import withStyledTemplate from './decorator'

export { default as withStyledTemplate } from './decorator'
export { default as styled } from './constructor'

export const styledTemplate = (...args) => view(
  withStyledTemplate(...args)
)

export const only = (arg, style) => state => {
  const result = arg instanceof Function ? arg(state) : state[arg]
  return result ? style : ''
}
