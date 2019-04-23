import { h, isElementNode, isViewNode, isDevelopment, warn } from 'malina'
import { compose, omit } from 'malina-util'
import { withTemplate, withLifecycle } from './common'

const accessElement = (root, path) => {
  let next = root
  for (const i of path) {
    if (next == null)
      break
    next = next.childNodes[i] || null
  }

  return next
}

const key = Symbol.for('__malina_refs')

const pathKey = path => path.join('.')

const warnShowedViews = new Set()
const warnCheckLimit = 10000

const warnInnerViewRef = node =>
  warn(`\
Incorrect use of refs:

${node}

Views can only handle its own refs. When a ref passed to a child-node inside another view-node it will be ignored`)

const warnInnerViewRefs = (key, node, parent = null) => {
  const elementNode = isElementNode(node)
  const viewNode = isViewNode(node)
  if (elementNode && key in node.attrs) {
    if (parent != null && warnShowedViews.size < warnCheckLimit)
      warnShowedViews.add(parent.tag.id)
    warnInnerViewRef(parent || node)
    return true
  } else if (elementNode || (viewNode && !warnShowedViews.has(node.tag.id))) {
    let warned = false
    for (const child of node.children) {
      warned = warnInnerViewRefs(key, child, viewNode ? node : parent)
      if (warned)
        break
    }

    return warned
  } else return false
}

const mapNodeChildRefs = (key, node, path, refs) =>
  node.children.map((node, i) => {
    const nextPath = path.concat([i])
    return collectRefsInt(key, node, nextPath, refs).node
  })

const collectRefsInt = (key, node, path, refs) => {
  const elementNode = isElementNode(node)
  if (elementNode && key in node.attrs) {
    const consumer = node.attrs[key]
    if (!(consumer instanceof Function) && typeof consumer !== 'string')
      throw new Error('Ref consumer must be a function or a string')
    refs.set(pathKey(path), { path, consumer })
    const children = mapNodeChildRefs(key, node, path, refs)
    const nextNode = h(node.tag, omit([key], node.attrs), children)
    return { refs, node: nextNode }
  } else if (elementNode) {
    const children = mapNodeChildRefs(key, node, path, refs)
    const nextNode = h(node.tag, node.attrs, children)
    return { refs, node: nextNode }
  } else if (isDevelopment && isViewNode(node) && !warnShowedViews.has(node.tag.id))
    warnInnerViewRefs(key, node, node)

  return { refs, node }
}

const collectRefs = (key, node) => {
  const refs = new Map()
  if (Array.isArray(node)) {
    const result = []
    for (const i in node) {
      const nextPath = [i]
      result.push(collectRefsInt(key, node, nextPath, refs).node)
    }

    return { refs, node: result }
  } else return collectRefsInt(key, node, [], refs)
}

const publishRef = (view, { path, consumer }) => {
  const element = accessElement(view.element, path)
  if (element == null)
    throw new Error('Internal error: element not found by ref')

  if (consumer instanceof Function) consumer(element)
  else view.state[consumer] = element
}

const publishRefs = (view, prev, next) => {
  for (const key of next.keys()) {
    if (prev == null || !prev.has(key))
      publishRef(view, next.get(key))
    else {
      const prevRef = prev.get(key)
      const nextRef = next.get(key)
      if (prevRef.consumer !== nextRef.consumer)
        publishRef(view, nextRef)
    }
  }
}

const publishDestroy = (view, refs) => {
  for (const { consumer } of refs.values()) {
    if (consumer instanceof Function) consumer(null)
    else view.state[consumer] = null
  }
}

export const withRefs = (attrKey = 'ref') => compose(
  withTemplate(original => view => {
    const node = original()
    const { refs, node: nextNode } = collectRefs(attrKey, node)
    view.state[key].next = refs
    return nextNode
  }),

  withLifecycle({
    create: view => {
      view.state[key] = {
        prev: null,
        next: null
      }
    },

    mount: view => {
      publishRefs(view, view.state[key].prev, view.state[key].next)
      view.state[key].prev = view.state[key].next
    },

    update: view => {
      publishRefs(view, view.state[key].prev, view.state[key].next)
      view.state[key].prev = view.state[key].next
    },

    unmount: view => {
      publishDestroy(view, view.state[key].next)
      view.state[key].prev = null
    }
  })
)
