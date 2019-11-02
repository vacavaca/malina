import { h, view, branch, withTemplate, withState, withActions, withBehavior } from 'malina'
import { connectRouter, Route } from 'malina-router'

import Main from './main'
import Header from './header'
import Footer from './footer'
import { pathToFilter } from './filter'
import { loadTodosFromStorage, todosPeristence } from './persistence'
import { uuid } from './util'

// function to load initial state from the localstorage
const state = () => ({
  todos: loadTodosFromStorage()
})

/**
 * Set all todos in the current filter completed (or not)
 * 
 * @param {boolean} completed set todos as completed or not 
 * @param {function} filter filter function 
 * @returns {function} action
 */
const onAllComplete = (completed, filter) => ({ state: { todos } }) => ({
  todos: todos.map(todo => filter(todo) ? ({ ...todo, completed }) : todo)
})

/**
 * Set todo completed or incompleted
 * 
 * @param {Object} requestedTodo todo to set completed 
 * @param {boolean} completed set completed or not 
 * @returns {function} action
 */
const onComplete = (requestedTodo, completed) => ({ state: { todos } }) => ({
  todos: todos.map(todo => todo === requestedTodo ? ({ ...todo, completed }) : todo)
})

/**
 * Change todo title
 * 
 * @param {object} requestedTodo todo to chang*
 * @param {string} title new title 
 * @returns {function} action
 */
const onEdit = (requestedTodo, title) => ({ state: { todos } }) => ({
  todos: todos.map(todo => todo === requestedTodo ? ({ ...todo, title }) : todo)
})

/**
 * Destroy todo
 *  
 * @param {todo} requestedTodo todo to destroy 
 * @returns {function} action
 */
const onDestroy = requestedTodo => ({ state: { todos } }) => ({
  todos: todos.filter(todo => todo !== requestedTodo)
})

/**
 * Create todo
 * 
 * @param {string} title todo title 
 * @returns {function} action
 */
const onCreate = title => ({ state: { todos } }) => ({
  todos: todos.concat([{ title, completed: false, key: todos.length, id: uuid() }])
})

/**
 * Destroy completed todos
 * 
 * @returns {function} action
 */
const onDestroyCompleted = () => ({ state: { todos } }) => ({
  todos: todos.filter(({ completed }) => !completed)
})

const actions = {
  onAllComplete,
  onComplete,
  onEdit,
  onDestroy,
  onCreate,
  onDestroyCompleted
}

const behavior = view => {
  const persistTodos = todosPeristence()

  const { location, router } = view.state
  if (!location.hash)
    router.replace('/#/') // redirect to home path on app start

  view.onUpdate(({ state: { todos } }) => persistTodos(todos))
}

const template = ({ state: { todos }, actions }) =>
  <Route hash path="#/:filter?">{
    urlParams => {
      const filter = pathToFilter(urlParams.filter)

      return (
        <section class="todoapp">
          {/* Note: passing this view actions to the state of inner views, so inner views can call them  */}
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
  withBehavior(behavior)
)
