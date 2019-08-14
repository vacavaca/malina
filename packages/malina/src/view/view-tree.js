import { binarySearch } from 'malina-util'

/**
 * Compares two view paths
 * @param {Array} a first path
 * @param {Array} b second path
 * @returns {number} comparison
 */
const pathCompare = (a, b) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const cmp = a[i] - b[i]
    if (cmp !== 0)
      return cmp
  }

  return a.length - b.length
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
      end = search >= 0 ? search + 1 : -search - 1
    }

    end = end != null ? Math.min(end, this.index.length) : this.index.length

    if (!reverse) {
      for (let i = start; i < end; i++) {
        const { view, key } = this.index[i]
        const node = new ViewTreeNode(view)
        yield node
        if (node.deleted) {
          this.index.splice(i, 1)
          i -= 1
          end -= 1
          delete this.views[key]
        }
      }
    } else {
      for (let i = Math.max(end - 1, 0); i >= start; i--) {
        const { view, key } = this.index[i]
        const node = new ViewTreeNode(view)
        yield node
        if (node.deleted) {
          this.index.splice(i, 1)
          delete this.views[key]
        }
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
