exports.asyncTest = test => async () => {
  let queue = []
  let wake = null
  let lock = new Promise(resolve => { wake = resolve })

  test(fn => (...args) => {
    queue.push(fn(...args))
    if (wake != null)
      wake()
  })

  await lock
  wake = null

  while (queue.length > 0) {
    await Promise.all(queue)
    queue = []
  }
}
