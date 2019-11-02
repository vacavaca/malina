const storageKey = 'todos-malina'

/**
 * Load todos from the local storage
 * 
 * @returns {Array.<Object>} todos
 */
export const loadTodosFromStorage = () => {
  const item = localStorage.getItem(storageKey)
  try {
    return JSON.parse(item) || []
  } catch (ignore) {
    return []
  }
}

/**
 * Save all todos to the local storage
 * 
 * @param {Array.<Object>} todos todos 
 */
const saveTodosToStorage = todos =>
  localStorage.setItem(storageKey, JSON.stringify(todos))

/**
 * Create updater function that saves todo list
 * to the local storage
 * 
 * @returns {function} updater function
 */
export const todosPeristence = () => {
  let prev = null
  return todos => {
    if (todos !== prev) {
      prev = todos
      saveTodosToStorage(todos)
    }
  }
}
