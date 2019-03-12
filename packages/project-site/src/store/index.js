import animation from './animation'
import version from './version'
import pageLoader from './page-loader'

const combineState = (...initialStates) => () => {
  let result = {}
  for (const initial of initialStates) {
    const state = initial instanceof Function ? initial() : initial
    result = { ...result, ...state }
  }

  return result
}

export default combineState(
  animation,
  version,
  pageLoader
)
