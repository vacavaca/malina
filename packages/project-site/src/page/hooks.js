
export const mount = (e, s, actions) => {
  actions.loadPage()
}

export const unmount = (e, s, actions) => {
  actions.cancelLoading()
}
