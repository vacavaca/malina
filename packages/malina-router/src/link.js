import { h, view, withState, withActions, withTemplate } from 'malina'
import { omit } from 'malina-util'
import { withRouter } from './router'

const state = {
  to: null,
  target: null,
  replace: false,
  state: {},
  view: 'a'
}

const reserved = ['router', 'to', 'replace', 'state', 'view']

const handleClick = e => ({ state: { router, to, target, replace, state } }) => {
  if (to == null)
    return

  const modified = !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)

  if (!e.defaultPrevented && e.button === 0 && (!target || target === '_self') && !modified) {
    e.preventDefault()

    const method = replace ? router.replace : router.push
    method(to, state)
  }
}

export default view(
  withTemplate(({ state: { to, view, ...rest }, actions, children }) =>
    h(view, {
      href: to,
      onClick: actions.handleClick,
      ...omit([reserved], rest)
    }, children)),
  withState(state),
  withActions({ handleClick }),
  withRouter()
)
