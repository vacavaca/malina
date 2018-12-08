import { h, view } from 'malina'
import { connectRouter, Route } from 'malina-router'

import Main from './main'
import Header from './header'
import Footer from './footer'
import { all, pathToFilter } from './filter'
import { branch, uuid } from './util'

const storageKey = 'todos-malina'

const loadTodosFromStorage = () => {
  const item = localStorage.getItem(storageKey)
  try {
    return JSON.parse(item) || []
  } catch (ignore) {
    return []
  }
}

const saveTodosToStorage = todos =>
  localStorage.setItem(storageKey, JSON.stringify(todos))

const todosPeristence = () => {
  let prev = null
  return todos => {
    if (todos !== prev) {
      prev = todos
      saveTodosToStorage(todos)
    }
  }
}

// function to load initial state from the localstorage
const state = () => ({
  todos: loadTodosFromStorage()
})

const actions = {}

actions.onAllComplete = (completed, filter) => ({ todos }) => ({
  todos: todos.map(todo => filter(todo) ? ({ ...todo, completed }) : todo)
})

actions.onComplete = (requestedTodo, completed) => ({ todos }) => ({
  todos: todos.map(todo => todo === requestedTodo ? ({ ...todo, completed }) : todo)
})

actions.onEdit = (requestedTodo, title) => ({ todos }) => ({
  todos: todos.map(todo => todo === requestedTodo ? ({ ...todo, title }) : todo)
})

actions.onDestroy = (requestedTodo, title) => ({ todos }) => ({
  todos: todos.filter(todo => todo !== requestedTodo)
})

actions.onCreate = title => ({ todos }) => ({
  todos: todos.concat([{ title, completed: false, key: todos.length, id: uuid() }])
})

actions.onDestroyCompleted = () => ({ todos }) => ({
  todos: todos.filter(({ completed }) => !completed)
})

const hooks = () => {
  const persistTodos = todosPeristence()

  const create = (_, { router, location }) => {
    if (!location.hash)
      router.replace('/#/')
  }

  const update = (_, { todos }) => persistTodos(todos)

  return { create, update }
}

export default connectRouter(view(({ todos }, actions) =>
  <Route hash path="#/:filter?">{urlParams => {
    const filter = pathToFilter(urlParams.filter)

    return <section class="todoapp">
      <Header actions={actions} />
      {branch(todos.length > 0,
        <Main todos={todos.filter(filter)} actions={actions} filter={filter} />)}
      {branch(todos.length > 0,
        <Footer filter={filter} todos={todos} actions={actions} />)}

    </section>
  }}</Route>,
  state, actions, hooks))
