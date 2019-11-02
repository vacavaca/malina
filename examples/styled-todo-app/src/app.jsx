import { h, view, branch, withTemplate, withState, withActions, withLifecycle } from 'malina'
import { connectRouter, Route } from 'malina-router'
import { styled, withStyledTemplate } from 'malina-styled'

import Main from './main'
import Header from './header'
import Footer from './footer'
import { all, pathToFilter } from './filter'
import { loadTodosFromStorage, todosPeristence } from './persistence'
import { uuid } from './util'

import './global.css'

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

const Section = styled.section`
background: #fff;
margin: 130px 0 40px 0;
position: relative;
box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2),
            0 25px 50px 0 rgba(0, 0, 0, 0.1);
`

const update = view => {
  view.state.persistTodos(view.state.todos)
}

const TodoApp = view(
  withStyledTemplate(({ state: { todos, filter }, actions }) => (
    <Section>
      <Header actions={actions} />
      {branch(todos.length > 0,
        <Main todos={todos.filter(filter)} actions={actions} filter={filter} />)}
      {branch(todos.length > 0,
        <Footer filter={filter} todos={todos} actions={actions} />)}
    </Section>

  )),
  withState(state),
  withActions(actions),
  withLifecycle({ update })
)

const create = view => {
  view.state.persistTodos = todosPeristence()

  const { location, router } = view.state
  if (!location.hash)
    router.replace('/#/')
}

const template = ({ state: { persistTodos }, actions }) =>
  <Route hash path="#/:filter?">{
    urlParams => {
      const filter = pathToFilter(urlParams.filter)
      return <TodoApp filter={filter} persistTodos={persistTodos} />
    }}
  </Route>

export default view(
  withStyledTemplate(template),
  connectRouter(),
  withLifecycle({ create })
)
