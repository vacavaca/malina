import pathToRegexp from 'path-to-regexp'
import { connectRouter } from './router'
import { compose, flatten } from '../util'
import { withState } from '../decorator/index'
import { h, view, isViewNode, isTextNode } from '../ui/index'

const pathCache = new Map()
const pathCacheLimit = 10000

const getCacheKey = (path, options) => {
  const optionsKeys = Object.keys(options)
  if (!optionsKeys.every(key => {
    const option = options[key]
    return typeof option !== 'object' && typeof option !== 'function'
  })) return null

  optionsKeys.sort()

  return `${path}${optionsKeys.map(k => `${k}:${options[k]}`).join(',')}`
}

const compilePathRegexp = (path, options) => {
  const cacheKey = getCacheKey(path, options)
  if (pathCache.has(cacheKey)) return pathCache.get(cacheKey)
  else {
    const keys = []
    const regexp = pathToRegexp(path, keys, options)
    const result = { regexp, keys }

    if (pathCache.size < pathCacheLimit)
      pathCache.set(cacheKey, result)
    return result
  }
}

const matchUrl = (url, path, options = {}) => {
  const { regexp, keys } = compilePathRegexp(path, options)
  const match = regexp.exec(url)

  if (!match) return null
  const values = match.slice(1)
  const params = keys.reduce((a, key, index) => ((a[key.name] = values[index] || null) || true) && a, {})
  return params
}

export const match = (location, path, options = {}) => {
  let part = options.hash ? location.hash : location.pathname
  if (options.hash && !part.startsWith('#'))
    part = `#${part}`
  if (!options.hash && !part.startsWith('/'))
    part = `/${part}`

  return matchUrl(part, path, options)
}

const routeKey = Symbol('route')

const RouteView = connectRouter(view((state, _, children = []) => {
  const render = children[0]
  if (children.length > 1)
    throw new Error('You must provide ony one child to Route it can be a render function or a jsx node')

  const params = match(state.location, state.path, { ...state.options, hash: !!state.hash })
  return render instanceof Function ? render(params) : render
}, { [routeKey]: true }))

export const Route = compose(
  withState({ [routeKey]: true }),
  connectRouter
)(RouteView)

const filterSwitchRoutes = (location, isRoot = false) => node => {
  const viewNode = isViewNode(node)
  let isRoute = viewNode && node.tag.state != null
  let routeInitialState = null
  if (isRoute) {
    const declaredState = node.tag.state
    routeInitialState = declaredState instanceof Function ? declaredState(node.attrs) : declaredState
    isRoute = routeInitialState[routeKey]
  }

  if (isRoute) {
    const { attrs: state } = node
    const { children } = node
    const params = match(location, state.path, { ...state.options, hash: !!state.hash })
    if (params == null)
      return null

    if (children.length > 1) {
      if (isRoot)
        throw new Error('You must provide ony one child to Route it can be a render function or a jsx node')

      if (Array.isArray(children)) {
        return flatten(children
          .map(filterSwitchRoutes(location)))
          .filter(node => node != null)
      } else return filterSwitchRoutes(location)(children)
    } else if (children.length === 1) {
      const render = children[0]
      const next = render instanceof Function ? render(params) : render
      if (Array.isArray(next)) {
        return flatten(next
          .map(filterSwitchRoutes(location)))
          .filter(node => node != null)
      } else return filterSwitchRoutes(location)(next)
    } else return null
  } else if (!isTextNode(node)) {
    const children = flatten(node.children
      .map(filterSwitchRoutes(location)))
      .filter(node => node != null)
    return h(node.tag, node.attrs, children)
  } else return node
}

export const Switch = connectRouter(view((state, _, children) => {
  if (children.length === 0)
    return null

  const filtered = children
    .map(filterSwitchRoutes(state.location, true))
    .filter(node => node != null)

  if (filtered.length === 0)
    return null

  if (filtered.length > 1)
    throw new Error('Root element must be defined inside Switch node')

  return filtered[0]
}))
