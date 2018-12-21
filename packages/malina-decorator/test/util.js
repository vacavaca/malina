exports.asyncTest = test => done => {
  let isDone = false
  try {
    (async () => {
      let queue = []
      let wake = null
      let lock = new Promise(resolve => { wake = resolve })

      test(fn => (...args) => {
        queue.push(fn(...args).catch(err => {
          isDone = true
          done(err)
        }))
        if (wake != null)
          wake()
      }).catch(done)

      await lock
      wake = null

      while (queue.length > 0) {
        await Promise.all(queue)
        queue = []
      }

      if (!isDone)
        done()
    })()
  } catch (err) {
    done(err)
  }
}
