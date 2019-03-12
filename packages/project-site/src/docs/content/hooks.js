import { runMicroTask } from '../../util'

export const mount = (element, state, actions) => {
  state.element = element
  runMicroTask(actions.highlight)
}

export const update = (e, s, actions) => {
  runMicroTask(actions.highlight)
}

export const unmount = (element, state) => {
  state.element = null
}
