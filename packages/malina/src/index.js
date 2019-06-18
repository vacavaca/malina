import { compose } from 'malina-util'
import { Declaration } from './vdom'
import { None } from './util'

export { h, isElementNode, isViewNode, isTextNode, Node, Declaration } from './vdom'
export { instantiate, render, hydrate, mount } from './view'
export { isDevelopment, isProduction, getGlobal, warn } from './env'
export { Debug, Id, None, Show, Hide, List, Map, branch, decorator } from './util'

/**
 * Declare view composed from a list of decorators
 *
 * @param  {...any} args decorators or one vdom node
 * @returns {Declaration} view declaration
 */
export const view = (...args) => {
  if (args.length > 1) return compose(...args)(None)
  else if (args.length === 1) {
    const arg = args[0]
    if (arg instanceof Function) return arg(None)
    else return new Declaration(arg)
  } else return None
}

/**
 * Declare a simple view that only renders some template
 * using it's state and children
 *
 * @param {Function|Node|string|null} arg vdom node or a function that returns vdom node
 * @returns {Declaration} view declaration
 */
export const template = arg => new Declaration(arg)
