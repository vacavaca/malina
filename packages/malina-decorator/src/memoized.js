import { decorator, isDevelopment, warn } from 'malina'

const warnToManyMemoized = () =>
  warn(`\
Too many views are decorated with the same decorator, you are probably leaking view declarations i.e. declaring new views while running or rendering!

Keep in mind that due to the declarative style of this library it's recommended to declare all your views statically, in the top-level scope of your modules.`)

export const memoizedDecorator = (decorate, limit = 10000) => {
  const decoratedCache = new Map()
  const decoratedCacheLimit = limit

  return decorator(Inner => {
    if (decoratedCache.has(Inner.template)) return decoratedCache.get(Inner.template)
    else {
      let decorated = decorate(Inner)
      if (decoratedCache.size < decoratedCacheLimit)
        decoratedCache.set(Inner.template, decorated)

      if (isDevelopment && decoratedCache.size >= decoratedCacheLimit * 0.9)
        warnToManyMemoized()

      return decorated
    }
  })
}
