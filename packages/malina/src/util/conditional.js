import { view } from '../view'

export const branch = (test, left, right = null) => test ? left : right

export const Show = view(({ state: { when = false }, children }) => {
  if (when) return children
  else return null
})

export const Hide = view(({ state: { when = true }, children }) => {
  if (when) return null
  else return children
})
