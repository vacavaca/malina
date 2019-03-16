const { decorator, view } = require('..')

const createInitializer = value => state => {
  if (value instanceof Function) return value(state) || {}
  else return value || {}
}

const withBehavior = (...handlers) => decorator(Inner =>
  view(Inner.template, view => {
    Inner.behavior(view)
    for (const handler of handlers)
      handler(view)
  }, Inner.actions)
)

const withActions = actions => decorator(Inner =>
  view(Inner.template, Inner.behavior, {
    ...(Inner.actions || {}),
    ...(actions || {})
  }))

const withState = state => withBehavior(
  view => {
    view.state = { ...view.state, ...createInitializer(state)(view.state) }
  }
)

const asyncTest = test => done => {
  let isDone = false
  try {
    (async () => {
      let queue = []
      let wake = null
      let lock = new Promise(resolve => { wake = resolve })

      await test(fn => (...args) => {
        queue.push(fn(...args).catch(err => {
          if (!isDone) {
            isDone = true
            done(err)
          }
        }))
        if (wake != null)
          wake()
      }, err => {
        if (!isDone) {
          isDone = true
          done(err)
        }
      })

      await lock
      wake = null

      while (queue.length > 0) {
        await Promise.all(queue)
        queue = []
      }

      if (!isDone) {
        isDone = true
        done()
      }
    })().catch(err => {
      if (!isDone) {
        isDone = true
        done(err)
      }
    })
  } catch (err) {
    if (!isDone) {
      isDone = true
      done(err)
    }
  }
}

module.exports = {
  withBehavior,
  withActions,
  withState,
  asyncTest
}
