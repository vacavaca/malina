import { omit } from 'malina-util'
import { view } from '../view'
import { log as consoleLog } from '../env'

const log = (view, msg) => {
  const parentElement = view.element != null ? view.element.parentNode : null
  const index = parentElement != null ? Array.prototype.indexOf.call(parentElement.childNodes, view.element) : null

  let logArgs = !view.isDestroyed ? [omit(['logger'], view.state)] : []
  if (parentElement != null)
    logArgs = [...logArgs, { parent: parentElement, index }]

  if ('logger' in view.state)
    view.state.logger(msg, ...logArgs)
  else consoleLog(msg, ...logArgs)
}

const onCreate = view => {
  const msg = 'DEBUG: created ' + (view.state.info ? `"${view.state.info}"` : '')
  log(view, msg)
}

const onMount = view => {
  const msg = 'DEBUG: mounted ' + (view.state.info ? `"${view.state.info}"` : '')
  log(view, msg)
}

const onUpdate = view => {
  const msg = 'DEBUG: updated ' + (view.state.info ? `"${view.state.info}"` : '')
  log(view, msg)
}

const onUnmount = view => {
  const msg = 'DEBUG: unmounted ' + (view.state.info ? `"${view.state.info}"` : '')
  log(view, msg)
}

const onDestroy = view => {
  const msg = 'DEBUG: destroyed ' + (view.state.info ? `"${view.state.info}"` : '')
  log(view, msg)
}

const behavior = view => {
  onCreate(view)

  view.onMount(onMount)
  view.onUpdate(onUpdate)
  view.onUnmount(onUnmount)
  view.onDestroy(onDestroy)
}

export default view(null, behavior)
