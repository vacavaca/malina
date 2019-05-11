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

/**
 * Search the specified value in the specified array using
 * binary search algorithm
 * @param {*} value search value
 * @param {array} array array to search in
 * @param {function} compare comparator to use
 * @returns {number} index of the search value
 * if it is contained in the array, otherwise
 * returns (-insert - 1) where insert is the
 * index at which value would be inserted into
 * the array or the index of the first element
 * in the array greater than provided value
 */

const binarySearch = (value, array, compare) => {
  if (array.length > 1) {
    let min = 0
    let max = array.length - 1

    while (min <= max) {
      const i = (min + max) >>> 1
      const element = array[i]
      const comp = compare(element, value)

      if (comp < 0)
        min = i + 1
      else if (comp > 0)
        max = i - 1
      else return i
    }

    return -min - 1
  } else if (array.length === 1) {
    const cmp = compare(value, array[0])
    if (cmp > 0) return -2
    else if (cmp < 0) return -1
    else return 0
  } else return -2
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
