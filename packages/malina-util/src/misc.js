export const compose = (...fns) => {
  if (fns.length === 0)
    return arg => arg

  if (fns.length === 1)
    return fns[0]

  return fns.reduce((a, b) => (...args) => b(a(...args)))
}

export const keys = obj =>
  Object.getOwnPropertyNames(obj)
    .concat(Object.getOwnPropertySymbols(obj))

const shallowEqualArray = (a, b) => {
  if (a === b)
    return true

  if ((a == null) !== (b == null))
    return false

  if (a == null)
    return true

  const len = a.length
  if (len !== b.length)
    return false

  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i])
      return false
  }

  return true
}

const shallowEqualObject = (a, b) => {
  if (a === b)
    return true

  if ((a == null) !== (b == null))
    return false

  if (a == null)
    return true

  const props = keys(a)
  const len = props.length
  if (keys(b).length !== len)
    return false

  for (const key of props) {
    if (a[key] !== b[key])
      return false
  }

  return true
}

export const shallowEqual = (a, b) => {
  const aIsArray = Array.isArray(a)
  if (aIsArray !== Array.isArray(b))
    return false

  return aIsArray ? shallowEqualArray(a, b) : shallowEqualObject(a, b)
}

export const omit = (names, obj) => {
  const result = {}
  const index = {}
  const len = names.length
  let i = 0

  while (i < len) {
    index[names[i]] = true
    i += 1
  }

  for (const key of keys(obj)) {
    if (!(key in index))
      result[key] = obj[key]
  }

  return result
}

export const flatten = array => {
  const result = []
  const len = array.length
  let i = 0

  while (i < len) {
    if (Array.isArray(array[i])) {
      const value = flatten(array[i])
      const nextLen = value.length
      let j = 0
      while (j < nextLen) {
        result[result.length] = value[j]
        j += 1
      }
    } else result[result.length] = array[i]
    i += 1
  }

  return result
}
