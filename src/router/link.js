import { h, view } from '../ui/index'
import { withRouter } from './router'
import { omit } from '../util'

const state = {
  to: null,
  target: null,
  replace: false,
  state: {}
}

const actions = {}

actions.handleClick = e => ({ router, to, target, replace, state }) => {
  if (to == null)
    return

  const modified = !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)

  if (!e.defaultPrevented && e.button === 0 && (!target || target === '_self') && !modified) {
    e.preventDefault()

    const method = replace ? router.replace : router.push
    method(to, state)
  }
}

export default withRouter(view(({ to, ...rest }, actions, children) =>
  h('a', {
    href: to,
    onClick: actions.handleClick,
    ...omit(['router', 'replace', 'state'], rest)
  }, children),
state, actions))
