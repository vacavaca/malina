import { binarySearch } from 'malina-util'

/**
 * Compares two view paths
 * @param {Array} a first path
 * @param {Array} b second path
 * @returns {number} comparison
 */
const pathCompare = (a, b) => {
  const lenCmp = a.length - b.length
  if (lenCmp !== 0)
    return -lenCmp // reverse depth order

  for (const i in a) {
    const cmp = a[i] - b[i]
    if (cmp !== 0)
      return cmp
  }

  return 0
}

const nextPath = (path, n = 1) => path.length ? path.slice(0, -1).concat([path[path.length - 1] + n]) : path

const isRoot = path => path.length === 0

class ViewTreeNode {
  constructor(view) {
    this.view = view
    this.deleted = false
  }

  delete() {
    this.deleted = true
  }
}

export default class ViewTree {
  constructor() {
    this.views = {}
    this.index = []
  }

  hasView(path) {
    return ViewTree.getPathKey(path) in this.views
  }

  getView(path) {
    const key = ViewTree.getPathKey(path)
    return key in this.views ? this.views[key].view : null
  }

  /**
   * Default order is inside-out, from first to last
   */
  * iterateViews(path = [], reverse = false) {
    let start = 0
    if (!isRoot(path)) {
      const search = this.searchPath(path)
      start = search >= 0 ? search : -search - 1
    }

    let end = null
    if (!isRoot(path)) {
      const search = this.searchPath(nextPath(path))
      end = search >= 0 ? search + 1 : -search
    }

    end = end != null ? Math.min(end, this.index.length) : end

    for (let i = start; i < (end !== null ? end : this.index.length); i++) {
      const realIndex = !reverse ? i : this.index.length - i - 1
      const { view, key } = this.index[realIndex]
      const node = new ViewTreeNode(view)
      yield node
      if (node.deleted) {
        this.index.splice(realIndex, 1)
        if (!reverse)
          i -= 1
        delete this.views[key]
      }
    }
  }

  addView(path, view) {
    const search = this.searchPath(path)
    const insert = search >= 0 ? search : -search - 1

    const key = ViewTree.getPathKey(path)
    const entry = { view, path, key }
    this.views[key] = entry
    this.index.splice(insert, 0, entry)
  }

  removeView(path) {
    const key = ViewTree.getPathKey(path)

    if (!(key in this.views))
      return null

    const search = this.searchPath(path)
    const { view } = this.views[key]

    this.index.splice(search, 1)
    delete this.views[key]

    return view
  }

  isEmpty() {
    return this.index.length === 0
  }

  /** @private */
  static getPathKey(path) {
    return path.join('.')
  }

  /** @private */
  searchPath(path) {
    return binarySearch(path, this.index, (a, b) => {
      const aPath = 'path' in a ? a.path : a
      const bPath = 'path' in b ? b.path : b
      return pathCompare(aPath, bPath)
    })
  }
}
