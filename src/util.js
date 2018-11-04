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


export const shallowEqual = (a, b) => {
  if (a === b)
    return true

  if ((a == null) !== (b == null))
    return false

  if (a == null)
    return true

  const keys = Object.keys(a)
  const len = keys.length
  if (Object.keys(b).length !== len)
    return false

  for (const key of keys)
    if (a[key] !== b[key])
      return false

  return true
}
