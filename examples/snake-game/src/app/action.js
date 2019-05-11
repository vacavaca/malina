import { saveBestToStorage } from './state'

const actions = {}

actions.handleScore = score => ({ state, actions }) => {
  if (score > state.best) {
    saveBestToStorage(score)
    return { score, best: score }
  } else return { score }
}

export default actions
