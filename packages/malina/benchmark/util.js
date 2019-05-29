const Benchmark = require('benchmark')
const { decorator, view } = require('..')

class Suite {
  constructor() {
    this.tests = []
  }

  add(name, ...args) {
    const start = args.length > 1 ? args[0] : () => { }
    const fn = args.length > 1 ? args[1] : args[0]
    const end = args.length > 2 ? args[2] : () => { }

    const ctx = {}

    this.tests.push(new Benchmark.Suite({
      onStart: () => start(ctx),
      onComplete: () => end(ctx)
    }).add(name, () => fn(ctx)))

    return this
  }
}

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

module.exports = {
  Suite,
  withBehavior,
  withActions,
  withState
}
