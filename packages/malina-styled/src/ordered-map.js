// naive implementation of an Ordered Map using sorted array as an index
// it's safe to iterate over and delete elements on the fly

import { binarySearch } from 'malina-util'

export default class OrderedMap {
  constructor(compare) {
    this.index = []
    this.map = new Map()
    this.compare = compare
  }

  get size() {
    return this.map.size
  }

  has(key) {
    return this.map.has(key)
  }

  get(key) {
    return this.map.get(key)
  }

  set(key, value, index = null) {
    if (!this.has(key)) {
      const knownIndex = index !== null ? index : this.insertPoint(key)
      this.index.splice(knownIndex, 0, key)
    }

    this.map.set(key, value)
  }

  delete(key, index = null) {
    if (this.has(key)) {
      let knownIndex = index !== null ? index : binarySearch(key, this.index, this.compare)
      let delta = 0
      while (this.index[knownIndex + delta] !== key && this.index[knownIndex - delta] !== key)
        delta += 1

      knownIndex = this.index[knownIndex + delta] === key ? knownIndex + delta : knownIndex - delta
      this.index.splice(knownIndex, 1)
    }

    this.map.delete(key)
  }

  insertPoint(key) {
    const search = binarySearch(key, this.index, this.compare)
    return search >= 0 ? search : -search - 1
  }

  lastKey() {
    return this.index[this.index.length - 1]
  }

  last() {
    return this.get(this.lastKey())
  }

  * values() {
    for (const key of this.keys())
      yield this.map.get(key)
  }

  * keys() {
    let i = 0
    for (; i < this.index.length; i++) {
      const was = this.index.length
      yield this.index[i]
      const became = this.index.length
      i -= was - became
    }
  }

  * keysAfter(key) {
    const search = binarySearch(key, this.index, this.compare)
    const start = search >= 0 ? search + 1 : -search // -s - 1 + 1

    let i = start
    for (; i < this.index.length; i++) {
      const was = this.index.length
      yield this.index[i]
      const became = this.index.length
      i -= was - became
    }
  }

  * valuesAfter(key) {
    for (const k of this.keysAfter(key))
      yield this.map.get(k)
  }

  * [Symbol.iterator]() {
    for (const key of this.keys())
      yield [key, this.map.get(key)]
  }
}
