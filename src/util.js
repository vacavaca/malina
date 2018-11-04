export const none = {}

export const compose = (...fns) => {
  if (fns.length === 0) {
    return arg => arg
  }

  if (fns.length === 1) {
    return fns[0]
  }

  return fns.reduce((a, b) => (...args) => a(b(...args)))
}


export const keys = obj =>
  Object.getOwnPropertyNames(obj)
    .concat(Object.getOwnPropertySymbols(obj))


export const shallowEqual = (a, b) => {
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

  for (const key of props)
    if (a[key] !== b[key])
      return false

  return true
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

  for (const key of keys(obj))
    if (!(key in index))
      result[key] = obj[key]

  return result
}
