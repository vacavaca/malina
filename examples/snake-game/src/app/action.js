import { saveBestToStorage } from './state'

export const handleScore = score => ({ state, actions }) => {
  if (score > state.best) {
    saveBestToStorage(score)
    return { score, best: score }
  } else return { score }
}
