const hooks = {}

hooks.mount = (element, state, actions) =>
  actions.focus()

hooks.unmount = (e, s, actions) =>
  actions.pause()

export default hooks
