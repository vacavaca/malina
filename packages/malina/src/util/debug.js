import { omit, keys } from 'malina-util'
import { h, Declaration } from '../vdom'
import { log as consoleLog } from '../env'

const wrapLogger = logger => {
  const loggerOrConsole = logger != null ? logger : consoleLog
  return (msg, data = null) => {
    const logData = data != null ? { ...data } : null
    if (logData != null && 'state' in logData)
      logData.state = { ...omit(['logger'], logData.state) }

    let logArgs = logData != null ? [msg, logData] : [msg]
    loggerOrConsole(...logArgs)
  }
}

const getElementData = view => {
  const data = {
    parent: view.element.parentNode,
    index: Array.prototype.indexOf.call(view.element.parentNode.childNodes, view.element)
  }

  if (view.children != null && view.children.length > 0)
    data.element = view.element

  return data
}

const updatePreviousStorage = (prevStorage, view) => {
  prevStorage.prev = {
    state: view.state,
    children: view.children
  }
}

const getUpdateData = (prevStorage, view) => {
  let update = null

  const allkeys = {}
  for (const key of keys(prevStorage.prev.state))
    allkeys[key] = true

  for (const key of keys(view.state))
    allkeys[key] = true

  for (const key in allkeys) {
    const prevValue = prevStorage.prev.state[key]
    const nextValue = view.state[key]

    if (prevValue !== nextValue) {
      if (update === null)
        update = {}

      update[key] = nextValue
    }
  }

  return {
    previousState: prevStorage.prev.state,
    nextState: { ...view.state },
    previousChildren: prevStorage.prev.children,
    nextChildren: view.children,
    update,
    childrenUpdated: prevStorage.prev.children !== view.children
  }
}

const onCreate = logger => view => {
  const msg = 'DEBUG: created ' + (view.state.info ? `"${view.state.info}"` : '')
  const data = {
    state: view.state
  }

  logger(msg, data)
}

const onMount = (logger, prevStorage) => view => {
  const msg = 'DEBUG: mounted ' + (view.state.info ? `"${view.state.info}"` : '')
  const data = {
    state: view.state,
    element: getElementData(view)
  }

  updatePreviousStorage(prevStorage, view)

  logger(msg, data)
}

const onUpdate = (logger, prevStorage) => view => {
  const msg = 'DEBUG: updated ' + (view.state.info ? `"${view.state.info}"` : '')
  const data = {
    state: view.state,
    element: getElementData(view)
  }

  const update = getUpdateData(prevStorage, view)
  if (update != null)
    data.update = update

  updatePreviousStorage(prevStorage, view)

  logger(msg, data)
}

const onUnmount = logger => view => {
  const msg = 'DEBUG: unmounted ' + (view.state.info ? `"${view.state.info}"` : '')
  const data = {
    state: view.state,
    element: getElementData(view)
  }

  logger(msg, data)
}

const onDestroy = logger => view => {
  const msg = 'DEBUG: destroyed ' + (view.state.info ? `"${view.state.info}"` : '')
  logger(msg)
}

const behavior = logger => view => {
  const prevStorage = { prev: {} }

  onCreate(logger)(view)

  view.onMount(onMount(logger, prevStorage))
  view.onUpdate(onUpdate(logger, prevStorage))
  view.onUnmount(onUnmount(logger))
  view.onDestroy(onDestroy(logger))
}

const cachedViews = new Map()
const maxCached = 10000

const getDebugView = (logger = null) => {
  if (cachedViews.has(logger)) return cachedViews.get(logger)
  else {
    const View = new Declaration(null, behavior(wrapLogger(logger)))

    if (cachedViews.size < maxCached)
      cachedViews.set(logger, View)

    return View
  }
}

export default new Declaration(({ state, children }) =>
  h(getDebugView(state.logger), omit(['logger'], state), children)
).setDevelopmentOnly(true)
