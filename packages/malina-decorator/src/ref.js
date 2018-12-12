import { h, isElementNode, isViewNode, isDevelopment, warn } from 'malina'
import { compose, omit } from 'malina-util'
import { withTemplate, withHooks } from './common'

const accessElement = (root, path) => {
  let next = root
  for (const i of path) {
    if (next == null)
      break
    next = next.childNodes[i] || null
  }

  return next
}

const key = Symbol('refs')

const pathKey = path => path.join('.')

const warnShowedViews = new Set()
const warnCheckLimit = 10000

const warnInnerViewRef = node =>
  warn(`\
Incorrect use of refs:

${node}

Views can only handle its own refs. When the ref passed to a child-node inside another view-node it will be ignored`)

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
    if (!(consumer instanceof Function))
      throw new Error('Ref consumer must be a function')
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

const collectRefs = (key, node) =>
  collectRefsInt(key, node, [], new Map())

const publishRef = (root, { path, consumer }) => {
  const element = accessElement(root, path)
  if (element == null)
    throw new Error('Internal error: element not found by ref')

  consumer(element)
}

const publishRefs = (root, prev, next) => {
  for (const key of next.keys()) {
    if (prev == null || !prev.has(key))
      publishRef(root, next.get(key))
    else {
      const prevRef = prev.get(key)
      const nextRef = next.get(key)
      if (prevRef.consumer !== nextRef.consumer)
        publishRef(root, nextRef)
    }
  }
}

const publishUnmount = refs => {
  for (const { consumer } of refs.values)
    consumer(null)
}

export const withRefs = (attrKey = 'ref') => compose(
  withTemplate(original => (state, actions, children) => {
    const node = original(state, actions, children)
    const { refs, node: nextNode } = collectRefs(attrKey, node)
    state[key].next = refs
    return nextNode
  }),

  withHooks({
    create: original => (_, state) => {
      original()
      state[key] = {
        prev: null,
        next: null
      }
    },

    mount: original => (element, state) => {
      publishRefs(element, state[key].prev, state[key].next)
      state[key].prev = state[key].next
      original()
    },

    update: original => (element, state) => {
      publishRefs(element, state[key].prev, state[key].next)
      state[key].prev = state[key].next
      original()
    },

    unmount: original => (_, state) => {
      publishUnmount(state[key].next)
      original()
    }
  })
)
