const Benchmark = require('benchmark')

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

module.exports = {
  Suite
}
