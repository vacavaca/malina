export const mount = (e, s, actions) => {
  actions.handleScroll()
  window.addEventListener('scroll', actions.handleScroll)
}

export const unmount = (e, s, actions) => {
  window.removeEventListener('scroll', actions.handleScroll)
}