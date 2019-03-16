import { h, view } from 'malina'
import { withState, withActions } from 'malina-decorator'
import { omit } from 'malina-util'
import { withRouter } from './router'

const state = {
  to: null,
  target: null,
  replace: false,
  state: {}
}

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

export default view(({ state: { to, ...rest }, actions, children }) =>
  h('a', {
    href: to,
    onClick: actions.handleClick,
    ...omit(['router', 'replace', 'state'], rest)
  }, children))
  .decorate(
    withState(state),
    withActions({ handleClick }),
    withRouter
  )
