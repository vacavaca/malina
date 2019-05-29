import { Node, isViewNode } from './node'

const maxDepth = 4 // memoization depth in the node tree

const getReplacedNode = (prev, next, path) => {
  if (path.length >= maxDepth)
    return next

  const prevNode = Node.isNode(prev)
  if (prevNode !== Node.isNode(next))
    return next

  if (!prevNode)
    return next

  const prevView = isViewNode(prev)
  const nextView = isViewNode(next)

  if (prevView && nextView) {
    if (prev.isEqual(next)) return prev
  } else if (prevView === nextView) {
    const len = prev.children.length
    if (prev.isEqual(next, false) && len === next.children.length) {
      for (let i = 0; i < len; i++) {
        const nextPath = path.concat([i])
        const prevChild = prev.children[i]
        const nextChild = next.children[i]

        const replacedChild = getReplacedNode(prevChild, nextChild, nextPath)
        if (replacedChild !== prevChild)
          return next
      }

      return prev
    }
  }

  return next
}

const memoizedTemplate = fn => {
  if (maxDepth === 0)
    return fn

  let prev = null
  return (...args) => {
    const next = fn(...args)
    if (prev === next)
      return next

    const prevNode = Node.isNode(prev)
    const nextNode = Node.isNode(next)
    if (prevNode && nextNode) {
      const node = getReplacedNode(prev, next, [])
      prev = node
      return node
    } else if (nextNode) {
      prev = next
      return next
    } else {
      prev = null
      return next
    }
  }
}

const template = arg => {
  if (arg instanceof Function) return memoizedTemplate(arg)
  else return template(() => arg)
}

export default template
