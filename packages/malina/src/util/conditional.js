import { Declaration } from '../vdom'

export const branch = (test, left, right = null) => test ? left : right

export const Show = new Declaration(({ state: { when = false }, children }) => branch(when, children, null))

export const Hide = new Declaration(({ state: { when = true }, children }) => branch(when, null, children))
