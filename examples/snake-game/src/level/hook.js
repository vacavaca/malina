const hooks = {}

hooks.mount = (element, state, actions) => {
  state.focusHook = element.firstChild
  actions.focus()
}

hooks.unmount = (e, s, actions) =>
  actions.pause()

export default hooks
