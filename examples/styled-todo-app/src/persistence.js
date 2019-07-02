const storageKey = 'todos-malina'

export const loadTodosFromStorage = () => {
  const item = localStorage.getItem(storageKey)
  try {
    return JSON.parse(item) || []
  } catch (ignore) {
    return []
  }
}

const saveTodosToStorage = todos =>
  localStorage.setItem(storageKey, JSON.stringify(todos))

export const todosPeristence = () => {
  let prev = null
  return todos => {
    if (todos !== prev) {
      prev = todos
      saveTodosToStorage(todos)
    }
  }
}
