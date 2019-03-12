export const runMicroTask = task =>
  new Promise(resolve => resolve()).then(task)


export const cancellableFetch = (url, options) => {
  const controller = new AbortController();
  const promise = fetch(url, {
    ...options,
    signal: controller.signal
  })
  promise.cancel = () => controller.abort()
  return promise
}

export const keyMirror = (...args) => {
  let keys = args
  if (args.length === 1) {
    if (Array.isArray(args[0]))
      keys = args[0]
    else if (typeof args[0] === "object")
      keys = Object.keys(args[0])
  }

  return keys.reduce((a, k) => (a[k] = k || true) && a, {})
}

export const cancellablePromise = p => {
  let cancelled = false
  const wrapped = new Promise((resolve, reject) => p
    .then(value => {
      if (!cancelled)
        resolve(value)
    })
    .catch(err => {
      if (!cancelled)
        reject(err)
    }))

  wrapped.cancel = () => {
    cancelled = true
  }

  return wrapped
}