import { h, view, branch } from 'malina'
import { connectRouter, Route } from 'malina-router'
import { withTemplate, withState, withActions, withBehavior } from 'malina-decorator'

import Main from './main'
import Header from './header'
import Footer from './footer'
import { all, pathToFilter } from './filter'
import { loadTodosFromStorage, todosPeristence } from './persistence'
import { uuid } from './util'

// function to load initial state from the localstorage
const state = () => ({
  todos: loadTodosFromStorage()
})

const actions = {}

actions.onAllComplete = (completed, filter) => ({ state: { todos } }) => ({
  todos: todos.map(todo => filter(todo) ? ({ ...todo, completed }) : todo)
})

actions.onComplete = (requestedTodo, completed) => ({ state: { todos } }) => ({
  todos: todos.map(todo => todo === requestedTodo ? ({ ...todo, completed }) : todo)
})

actions.onEdit = (requestedTodo, title) => ({ state: { todos } }) => ({
  todos: todos.map(todo => todo === requestedTodo ? ({ ...todo, title }) : todo)
})

actions.onDestroy = (requestedTodo, title) => ({ state: { todos } }) => ({
  todos: todos.filter(todo => todo !== requestedTodo)
})

actions.onCreate = title => ({ state: { todos } }) => ({
  todos: todos.concat([{ title, completed: false, key: todos.length, id: uuid() }])
})

actions.onDestroyCompleted = () => ({ state: { todos } }) => ({
  todos: todos.filter(({ completed }) => !completed)
})

const behavior = view => {
  const persistTodos = todosPeristence()

  const { location, router } = view.state
  if (!location.hash)
    router.replace('/#/')

  view.onUpdate(({ state: { todos } }) => persistTodos(todos))
}

const template = ({ state: { todos }, actions }) =>
  <Route hash path="#/:filter?">{
    urlParams => {
      const filter = pathToFilter(urlParams.filter)

      return (
        <section class="todoapp">
          <Header actions={actions} />
          {branch(todos.length > 0,
            <Main todos={todos.filter(filter)} actions={actions} filter={filter} />)}
          {branch(todos.length > 0,
            <Footer filter={filter} todos={todos} actions={actions} />)}
        </section>
      )
    }}
  </Route>

export default view(
  withTemplate(template),
  withState(state),
  withActions(actions),
  connectRouter(),
  withBehavior(behavior),
)
