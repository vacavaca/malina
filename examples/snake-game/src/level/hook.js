const hooks = {}

hooks.mount = ({ actions }) =>
  actions.focus()

hooks.unmount = ({ actions }) =>
  actions.pause()

export default hooks
