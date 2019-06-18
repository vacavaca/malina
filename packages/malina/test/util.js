const { decorator, Declaration } = require('..')

const createInitializer = value => state => {
  if (value instanceof Function) return value(state) || {}
  else return value || {}
}

const withTemplate = template => decorator(Inner =>
  new Declaration(template, Inner.behavior, Inner.actions))

const withBehavior = (...handlers) => decorator(Inner =>
  new Declaration(Inner.template, view => {
    Inner.behavior(view)
    for (const handler of handlers)
      handler(view)
  }, Inner.actions)
)

const withActions = actions => decorator(Inner =>
  new Declaration(Inner.template, Inner.behavior, {
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
  withTemplate,
  withBehavior,
  withActions,
  withState,
  asyncTest
}
