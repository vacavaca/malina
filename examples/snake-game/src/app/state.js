const storageKey = 'snake-game-malina.best'

export default () => ({
  score: 0,
  best: loadBestFromStorage()
})

const loadBestFromStorage = () => {
  const item = localStorage.getItem(storageKey)
  try {
    return +item
  } catch (ignore) {
    return null
  }
}

export const saveBestToStorage = best =>
  localStorage.setItem(storageKey, `${best}`)
